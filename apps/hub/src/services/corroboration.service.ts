import config from '../config';
import { getDataStore } from '../db';
import { ThreatCategory, CorroborationResult, Member } from '../types';
import { SseService } from './sse.service';

export class CorroborationService {
  /**
   * Sanitizes and normalizes an IP address, stripping ports or query noise
   */
  static sanitizeIp(rawIp: string): string {
    if (!rawIp) return '';
    let ip = rawIp.trim();

    // Strip port if IPv4 with port (e.g., "192.168.1.1:8080" -> "192.168.1.1")
    if (ip.includes(':') && !ip.includes('::') && ip.split(':').length === 2) {
      ip = ip.split(':')[0];
    }

    // Strip bracket notation if present (e.g. "[::1]")
    if (ip.startsWith('[') && ip.endsWith(']')) {
      ip = ip.substring(1, ip.length - 1);
    }

    return ip;
  }

  /**
   * Normalizes threat category
   */
  static normalizeCategory(rawCategory?: string): ThreatCategory {
    if (!rawCategory) return 'unknown';
    const cat = rawCategory.toLowerCase().trim();
    const allowed: ThreatCategory[] = [
      'brute_force',
      'honeypot_probe',
      'sqli_xss',
      'rate_abuse',
      'scanner',
      'credential_stuffing',
      'bot_scraping',
    ];
    if (allowed.includes(cat as ThreatCategory)) {
      return cat as ThreatCategory;
    }
    // Map common aliases
    if (cat.includes('brute') || cat.includes('auth')) return 'brute_force';
    if (cat.includes('honey') || cat.includes('trap')) return 'honeypot_probe';
    if (cat.includes('sql') || cat.includes('xss') || cat.includes('inject')) return 'sqli_xss';
    if (cat.includes('rate') || cat.includes('flood') || cat.includes('ddos')) return 'rate_abuse';
    if (cat.includes('scan') || cat.includes('probe')) return 'scanner';
    if (cat.includes('bot') || cat.includes('crawler') || cat.includes('scrape')) return 'bot_scraping';
    return 'unknown';
  }

  /**
   * Processes an incoming threat report:
   * 1. Strips any identifying or private payload metadata.
   * 2. Saves report.
   * 3. Runs Dynamic Risk Weighting & Corroboration.
   * 4. Updates blocklist and triggers SSE broadcasts.
   * 5. Adjusts member reputations when corroborated.
   */
  static async processReport(
    reporter: Member,
    reportData: {
      ip: string;
      category?: string;
      confidence?: number;
    }
  ): Promise<CorroborationResult> {
    const store = await getDataStore();
    const attackerIp = this.sanitizeIp(reportData.ip);

    if (!attackerIp) {
      throw new Error('Invalid or missing IP address');
    }

    const category = this.normalizeCategory(reportData.category);
    const confidence = Math.max(0.05, Math.min(1.0, reportData.confidence ?? 0.8));

    // 1. Store anonymized threat report
    const newReport = await store.createThreatReport({
      reporter_member_id: reporter.id,
      attacker_ip: attackerIp,
      category,
      confidence,
    });

    // 2. Fetch recent reports for this IP within window
    const windowStartIso = new Date(
      Date.now() - config.corroborationWindowHours * 3600000
    ).toISOString();
    const recentReports = await store.getReportsForIp(attackerIp, windowStartIso);

    // 3. Compute Dynamic Threat Score
    // Group by distinct reporter and compute time-decayed risk weight
    const reportsByReporter = new Map<string, typeof recentReports>();
    for (const r of recentReports) {
      const list = reportsByReporter.get(r.reporter_member_id) || [];
      list.push(r);
      reportsByReporter.set(r.reporter_member_id, list);
    }

    let totalThreatScore = 0;
    const distinctReporterIds = Array.from(reportsByReporter.keys());

    for (const memberId of distinctReporterIds) {
      const memberReports = reportsByReporter.get(memberId)!;
      let memberReputation = 1.0;
      if (memberId === reporter.id) {
        memberReputation = reporter.reputation_score;
      } else {
        const mem = await store.getMemberById(memberId);
        if (mem) memberReputation = mem.reputation_score;
      }

      // Best report from this member with time decay
      let maxReporterWeight = 0;
      for (const r of memberReports) {
        const ageHours = Math.max(
          0,
          (Date.now() - new Date(r.created_at).getTime()) / 3600000
        );
        // Exponential decay: e^(-0.05 * ageHours)
        const timeDecay = Math.exp(-0.05 * ageHours);
        const weight = memberReputation * r.confidence * timeDecay;
        if (weight > maxReporterWeight) {
          maxReporterWeight = weight;
        }
      }
      totalThreatScore += maxReporterWeight;
    }

    totalThreatScore = Number(totalThreatScore.toFixed(2));
    const distinctReporters = distinctReporterIds.length;

    // 4. Corroboration Rules
    const isHoneypotTrigger = category === 'honeypot_probe' && confidence >= 0.85;
    const isCriticalWafTrigger = confidence >= 0.95 && reporter.reputation_score >= 1.0;
    const isSingleHighTrust = totalThreatScore >= config.corroborationThreshold;
    const isMultiReporterCorroborated =
      distinctReporters >= 2 && totalThreatScore >= config.multiReporterThreshold;

    const isPromoted =
      isHoneypotTrigger ||
      isCriticalWafTrigger ||
      isSingleHighTrust ||
      isMultiReporterCorroborated;

    let reason = 'Threat report recorded; awaiting corroboration';
    let action: CorroborationResult['action'] = 'pending_corroboration';

    if (isHoneypotTrigger) {
      reason = 'High-confidence honeypot trip triggered immediate network block';
    } else if (isCriticalWafTrigger) {
      reason = 'Critical WAF / exploit trigger from trusted node';
    } else if (isMultiReporterCorroborated) {
      reason = `Corroborated across ${distinctReporters} independent mesh nodes (Score: ${totalThreatScore})`;
    } else if (isSingleHighTrust) {
      reason = `Single high-reputation node promotion (Score: ${totalThreatScore})`;
    }

    // 5. If promoted, update Blocklist
    let blocklistEntry;
    if (isPromoted) {
      const existingBlock = await store.getBlocklistEntryByIp(attackerIp);

      // Determine TTL
      let ttlHours = config.defaultBlockTtlHours;
      if (distinctReporters >= 3 || category === 'sqli_xss' || category === 'honeypot_probe') {
        ttlHours = Math.max(ttlHours, 48);
      }
      const expiresAt = new Date(Date.now() + ttlHours * 3600000).toISOString();

      const wasAlreadyActive = existingBlock && existingBlock.is_active;

      blocklistEntry = await store.upsertBlocklistEntry({
        attacker_ip: attackerIp,
        primary_category: category,
        confidence: Math.max(existingBlock?.confidence || 0, confidence),
        corroboration_count: Math.max(existingBlock?.corroboration_count || 1, distinctReporters),
        is_active: true,
        expires_at: expiresAt,
      });

      action = wasAlreadyActive ? 'promoted_updated' : 'promoted_new';

      // 6. Broadcast SSE block event
      SseService.broadcast(wasAlreadyActive ? 'block_updated' : 'block_added', {
        type: wasAlreadyActive ? 'block_updated' : 'block_added',
        ip: blocklistEntry.attacker_ip,
        category: blocklistEntry.primary_category,
        confidence: blocklistEntry.confidence,
        corroborationCount: blocklistEntry.corroboration_count,
        expiresAt: blocklistEntry.expires_at,
        threatScore: totalThreatScore,
        timestamp: new Date().toISOString(),
      });

      // 7. Adjust member reputation scores for corroborated reports
      if (distinctReporters >= 2) {
        for (const memberId of distinctReporterIds) {
          const mem = await store.getMemberById(memberId);
          if (mem && mem.reputation_score < 5.0) {
            const newRep = Math.min(5.0, mem.reputation_score + 0.05);
            await store.updateMemberReputation(memberId, newRep);
          }
        }
      }
    } else {
      // Broadcast live anonymized threat pulse
      SseService.broadcast('threat_reported', {
        type: 'threat_reported',
        category,
        confidence,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      attackerIp,
      threatScore: totalThreatScore,
      distinctReporters,
      isPromoted,
      blocklistEntry,
      action,
      reason,
    };
  }
}
