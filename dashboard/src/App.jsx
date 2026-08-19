import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import MetricsBar from './components/MetricsBar';
import ThreatStream from './components/ThreatStream';
import AnalyticsSection from './components/AnalyticsSection';
import BlocklistTable from './components/BlocklistTable';
import SimulatorModal from './components/SimulatorModal';
import ClientPortal from './components/ClientPortal';

const HUB_API = import.meta.env.VITE_HUB_API || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://nexusshield.onrender.com');

const API_KEY = import.meta.env.VITE_NEXUS_API_KEY || 'nexus_dev_key_2026';
const ADMIN_TOKEN = import.meta.env.VITE_NEXUS_ADMIN_TOKEN || 'nexus_admin_secret_2026';

// Fallback Mock State when backend is temporarily offline
const MOCK_FALLBACK = {
  stats: {
    total_blocked: 5,
    attacks_today: 18,
    active_spokes: 2,
    network_status: "Active & Synchronized (Bloom Filter)",
    attack_distribution: [
      { name: 'SQL Injection', value: 12 },
      { name: 'XSS Vector', value: 4 },
      { name: 'Path Traversal', value: 2 }
    ],
    attacks_over_time: [
      { time: '00:00', count: 1 },
      { time: '04:00', count: 3 },
      { time: '08:00', count: 8 },
      { time: '12:00', count: 14 },
      { time: '16:00', count: 6 },
      { time: '20:00', count: 18 }
    ],
    recent_events: [
      { id: 1, ip: '198.51.100.5', attack_type: 'SQL Injection', timestamp: '2026-08-19 01:30:00', node: 'Site-A', status: 'Blocked' },
      { id: 2, ip: '203.0.113.42', attack_type: 'XSS Vector', timestamp: '2026-08-19 01:28:15', node: 'Site-B', status: 'Blocked' },
      { id: 3, ip: '192.0.2.12', attack_type: 'Path Traversal', timestamp: '2026-08-19 01:22:04', node: 'Site-A', status: 'Blocked' }
    ]
  },
  blocklist: [
    { ip: '198.51.100.5', attack_type: 'SQL Injection', timestamp: '2026-08-19 01:30:00', node: 'Site-A', status: 'Active' },
    { ip: '203.0.113.42', attack_type: 'XSS Vector', timestamp: '2026-08-19 01:28:15', node: 'Site-B', status: 'Active' },
    { ip: '192.0.2.12', attack_type: 'Path Traversal', timestamp: '2026-08-19 01:22:04', node: 'Site-A', status: 'Active' }
  ]
};

export default function App() {
  // Read initial query params
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get('view');
      if (viewParam === 'portal' || viewParam === 'client') {
        return 'client';
      }
    }
    return 'admin';
  });

  const [activeClientId, setActiveClientId] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('client') || 'client_A';
    }
    return 'client_A';
  });

  const [stats, setStats] = useState(MOCK_FALLBACK.stats);
  const [blocklist, setBlocklist] = useState(MOCK_FALLBACK.blocklist);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isUnbanningIp, setIsUnbanningIp] = useState(null);

  // Sync URL query params with current state
  const syncUrl = useCallback((view, clientId) => {
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (view === 'client') {
        url.searchParams.set('view', 'portal');
        if (clientId) url.searchParams.set('client', clientId);
      } else {
        url.searchParams.delete('view');
        url.searchParams.delete('client');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleSwitchView = (newView) => {
    setCurrentView(newView);
    syncUrl(newView, activeClientId);
  };

  const handleClientChange = (newClientId) => {
    setActiveClientId(newClientId);
    syncUrl('client', newClientId);
  };

  // Keyboard shortcut for Command/Ctrl+K -> Attack Simulator
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSimulatorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch latest data from FastAPI Hub
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, blocklistRes] = await Promise.all([
        axios.get(`${HUB_API}/stats`, { headers: { 'x-api-key': API_KEY }, timeout: 2500 }),
        axios.get(`${HUB_API}/blocklist`, { headers: { 'x-api-key': API_KEY }, timeout: 2500 })
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (blocklistRes.data && Array.isArray(blocklistRes.data.blocked_ips)) {
        setBlocklist(blocklistRes.data.blocked_ips);
      }
      setIsOnline(true);
    } catch (error) {
      // Hub is starting or offline -> keep fallback state
      setIsOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Real-Time Server-Sent Events (SSE) Stream Listener
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return;
    }

    const sseUrl = `${HUB_API}/events?api_key=${encodeURIComponent(API_KEY)}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsOnline(true);
      };

      eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'ban') {
            const newEvent = {
              id: Date.now() + Math.random(),
              ip: payload.ip,
              attack_type: payload.attack_type || 'Threat Intercepted',
              timestamp: new Date().toLocaleTimeString(),
              node: payload.client_id || 'Site-A',
              status: 'Blocked'
            };

            setStats(prev => ({
              ...prev,
              total_blocked: (prev?.total_blocked ?? 0) + 1,
              attacks_today: (prev?.attacks_today ?? 0) + 1,
              recent_events: [newEvent, ...(prev?.recent_events || [])]
            }));

            setBlocklist(prev => {
              const current = prev || [];
              const exists = current.some(item => (typeof item === 'object' ? item.ip : item) === payload.ip);
              if (exists) return current;
              return [
                {
                  ip: payload.ip,
                  attack_type: payload.attack_type || 'SQL Injection',
                  timestamp: new Date().toLocaleTimeString(),
                  expires_at: payload.expires_at || null,
                  client_id: payload.client_id || 'default',
                  node: payload.client_id || 'Site-A'
                },
                ...current
              ];
            });
          } else if (payload.event === 'unban') {
            setBlocklist(prev => (prev || []).filter(item => {
              const itemIp = typeof item === 'object' ? item.ip : item;
              return itemIp !== payload.ip;
            }));

            setStats(prev => ({
              ...prev,
              total_blocked: Math.max(0, (prev?.total_blocked || 1) - 1),
              recent_events: [
                {
                  id: Date.now() + Math.random(),
                  ip: payload.ip,
                  attack_type: 'Revoked / Unbanned',
                  timestamp: new Date().toLocaleTimeString(),
                  node: 'SOC-Admin',
                  status: 'Unbanned'
                },
                ...(prev?.recent_events || [])
              ]
            }));
          } else if (payload.event === 'clear') {
            setBlocklist([]);
            setStats(prev => ({
              ...prev,
              total_blocked: 0,
              recent_events: []
            }));
          }
        } catch (err) {
          // Ignore parsing errors
        }
      };

      eventSource.onerror = () => {
        // SSE will reconnect automatically
      };
    } catch (err) {
      console.error("SSE error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Initial load + Automatic 3-Second Background Polling fallback
  useEffect(() => {
    if (currentView === 'admin') {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchData, currentView]);

  // Unban / Revoke IP Action handler
  const handleUnbanIp = async (ip) => {
    setIsUnbanningIp(ip);
    try {
      if (isOnline) {
        await axios.delete(`${HUB_API}/unban/${encodeURIComponent(ip)}`, {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'x-admin-token': ADMIN_TOKEN
          }
        });
      }
      
      // Optimistic UI Update
      setBlocklist(prev => prev.filter(item => {
        const itemIp = typeof item === 'object' ? item.ip : item;
        return itemIp !== ip;
      }));

      setStats(prev => ({
        ...prev,
        total_blocked: Math.max(0, (prev.total_blocked || 1) - 1),
        recent_events: [
          {
            id: Date.now(),
            ip: ip,
            attack_type: 'Revoked / Unbanned',
            timestamp: new Date().toLocaleTimeString(),
            node: 'SOC-Admin',
            status: 'Unbanned'
          },
          ...(prev.recent_events || [])
        ]
      }));

      fetchData();
    } catch (error) {
      console.error(`Failed to unban IP ${ip}:`, error);
    } finally {
      setIsUnbanningIp(null);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 font-sans pb-16 relative overflow-hidden bg-linear-grid">
      
      {/* Ambient Gradient Glow Orbs (Stripe Aesthetic) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-32 right-1/4 w-[500px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        currentView={currentView}
        onSwitchView={handleSwitchView}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        apiKey={API_KEY}
        activeClientId={activeClientId}
      />

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Offline Banner if FastAPI is down */}
        {!isOnline && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono flex items-center justify-between shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>
                <strong>Threat Hub Connecting:</strong> Live sync at <code>{HUB_API}</code> is initializing. Using zero-knowledge local fallback telemetry.
              </span>
            </div>
            <button 
              onClick={handleManualRefresh}
              className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded-lg font-semibold transition-colors shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {currentView === 'client' ? (
          <ClientPortal 
            onBackToAdmin={() => handleSwitchView('admin')} 
            hubUrl={HUB_API} 
            apiKey={API_KEY}
            initialClientId={activeClientId}
            onClientChange={handleClientChange}
          />
        ) : (
          <>
            {/* 1. Top Metrics Bar (KPI Cards) */}
            <MetricsBar stats={stats} isOnline={isOnline} />

            {/* 2. Real-Time Threat Stream (Terminal / Live Feed Log) */}
            <ThreatStream events={stats?.recent_events || []} />

            {/* 3. Analytics & Visualization Section */}
            <AnalyticsSection 
              distribution={stats?.attack_distribution} 
              overTime={stats?.attacks_over_time} 
            />

            {/* 4. Global Blocklist Management Table */}
            <BlocklistTable 
              blocklist={blocklist} 
              onUnban={handleUnbanIp}
              isUnbanningIp={isUnbanningIp}
            />
          </>
        )}

      </main>

      {/* 5. Client / Spoke Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRefreshData={fetchData}
        hubApi={HUB_API}
        apiKey={API_KEY}
      />

    </div>
  );
}

