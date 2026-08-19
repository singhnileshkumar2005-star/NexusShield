'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreatEvent } from './types';
import { INITIAL_THREAT_EVENTS, generateSimulatedThreatEvent } from './mockData';
import { HubApi } from './api';

export function useSSE(maxHistory = 100) {
  const [events, setEvents] = useState<ThreatEvent[]>(INITIAL_THREAT_EVENTS);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'sse_live' | 'simulated_mesh'>('simulated_mesh');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(new Date());
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addEvent = useCallback((newEvent: ThreatEvent) => {
    setLastEventTime(new Date());
    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      return updated.slice(0, maxHistory);
    });
  }, [maxHistory]);

  const triggerSimulatedAttack = useCallback((customIp?: string, category?: any) => {
    const sim = generateSimulatedThreatEvent();
    if (customIp) sim.attackerIp = customIp;
    if (category) sim.category = category;
    sim.timestamp = new Date().toISOString();
    addEvent(sim);
    return sim;
  }, [addEvent]);

  useEffect(() => {
    let isMounted = true;
    const hubUrl = HubApi.getBaseUrl();

    // Try connecting via EventSource
    try {
      const sseUrl = `${hubUrl}/v1/events`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        setConnectionMode('sse_live');
      };

      es.onmessage = (e) => {
        if (!isMounted || isPaused) return;
        try {
          const parsed = JSON.parse(e.data);
          addEvent({
            id: parsed.id || `evt-${Date.now()}`,
            attackerIp: parsed.attackerIp || parsed.ip,
            category: parsed.category || 'brute_force',
            confidence: parsed.confidence ?? 0.90,
            timestamp: parsed.timestamp || new Date().toISOString(),
            action: parsed.action || 'blocked',
            corroborationCount: parsed.corroborationCount ?? 2,
            reporterMeshId: parsed.reporterMeshId || 'hub-mesh-sync',
            payloadSignature: parsed.payloadSignature,
            geo: parsed.geo,
          });
        } catch (err) {
          console.error('Error parsing SSE payload:', err);
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        // Fallback gracefully to simulated mesh mode
        setIsConnected(false);
        setConnectionMode('simulated_mesh');
        es.close();
      };
    } catch {
      setIsConnected(false);
      setConnectionMode('simulated_mesh');
    }

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isPaused, addEvent]);

  // Background ticker in simulated mode to generate occasional live background activity
  useEffect(() => {
    if (connectionMode === 'simulated_mesh' && !isPaused) {
      const scheduleNext = () => {
        const delay = Math.floor(Math.random() * 6000) + 4000; // 4-10s interval
        simIntervalRef.current = setTimeout(() => {
          addEvent(generateSimulatedThreatEvent());
          scheduleNext();
        }, delay);
      };

      scheduleNext();

      return () => {
        if (simIntervalRef.current) clearTimeout(simIntervalRef.current);
      };
    }
  }, [connectionMode, isPaused, addEvent]);

  const togglePause = () => setIsPaused((prev) => !prev);
  const clearEvents = () => setEvents([]);

  return {
    events,
    isConnected: connectionMode === 'sse_live' && isConnected,
    connectionMode,
    isPaused,
    lastEventTime,
    togglePause,
    clearEvents,
    triggerSimulatedAttack,
  };
}
