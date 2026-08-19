import { getDataStore } from '../db';
import { NetworkStats, SiteStats, Member, ThreatCategory } from '../types';
import { AuthService } from './auth.service';
import { SseService } from './sse.service';

const START_TIME = Date.now();

export class TelemetryService {
  /**
   * Records a blocked attack telemetry event for a member site
   */
  static async recordMitigation(
    memberId: string,
    blockedIp: string,
    threatCategory: string
  ): Promise<void> {
    const store = await getDataStore();
    await store.createSiteTelemetry({
      member_id: memberId,
      blocked_ip: blockedIp,
      threat_category: threatCategory,
    });

    await store.recordHeartbeat(memberId, 1);
  }

  /**
   * Records a periodic heartbeat from a member agent node
   */
  static async recordHeartbeat(
    memberId: string,
    mitigatedCount = 0
  ): Promise<Member | null> {
    const store = await getDataStore();
    return await store.recordHeartbeat(memberId, mitigatedCount);
  }

  /**
   * Compiles aggregate network statistics across the entire mesh
   */
  static async getNetworkStats(): Promise<NetworkStats> {
    const store = await getDataStore();

    const members = await store.listMembers();
    const activeBlocks = await store.getActiveBlocklist();
    const recentThreats = await store.getRecentThreatReports(50);
    const categoryBreakdown = await store.countReportsByCategory();
    const totalMitigations = await store.countTotalMitigations();

    // Active members: heartbeat within last 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const activeMembers = members.filter(
      (m) => m.is_active && new Date(m.last_heartbeat).getTime() >= fifteenMinutesAgo
    ).length;

    const totalReputation = members.reduce((sum, m) => sum + m.reputation_score, 0);
    const averageReputation =
      members.length > 0 ? Number((totalReputation / members.length).toFixed(2)) : 1.0;

    return {
      activeBlockedIps: activeBlocks.length,
      totalMitigations,
      totalMembers: members.length,
      activeMembers,
      averageReputation,
      categoryBreakdown,
      recentThreats: recentThreats.map((r) => ({
        id: r.id,
        category: r.category,
        confidence: r.confidence,
        created_at: r.created_at,
      })),
      recentBlocks: activeBlocks.slice(0, 20),
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      activeSseClients: SseService.getActiveClientsCount(),
    };
  }

  /**
   * Compiles site-specific telemetry & mitigation statistics
   */
  static async getSiteStats(memberId: string): Promise<SiteStats | null> {
    const store = await getDataStore();
    const member = await store.getMemberById(memberId);
    if (!member) return null;

    const recentMitigations = await store.getTelemetryForMember(memberId, 100);
    const allowlist = await store.getAllowlistForMember(memberId);

    const threatCategoryDistribution: Record<string, number> = {};
    for (const t of recentMitigations) {
      threatCategoryDistribution[t.threat_category] =
        (threatCategoryDistribution[t.threat_category] || 0) + 1;
    }

    return {
      member: AuthService.sanitizeMember(member),
      mitigationsCount: member.total_mitigations || recentMitigations.length,
      recentMitigations,
      allowlistCount: allowlist.length,
      threatCategoryDistribution,
    };
  }
}
