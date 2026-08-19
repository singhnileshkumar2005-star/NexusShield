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
    network_status: "Connecting to Threat Hub...",
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
      { id: 1, ip: '192.168.1.5', attack_type: 'SQL Injection', timestamp: '2026-08-18 01:30:00', node: 'Site-A', status: 'Blocked' },
      { id: 2, ip: '10.0.0.42', attack_type: 'XSS Vector', timestamp: '2026-08-18 01:28:15', node: 'Site-B', status: 'Blocked' },
      { id: 3, ip: '172.16.0.12', attack_type: 'Path Traversal', timestamp: '2026-08-18 01:22:04', node: 'Site-A', status: 'Blocked' }
    ]
  },
  blocklist: [
    { ip: '192.168.1.5', attack_type: 'SQL Injection', timestamp: '2026-08-18 01:30:00', node: 'Site-A', status: 'Active' },
    { ip: '10.0.0.42', attack_type: 'XSS Vector', timestamp: '2026-08-18 01:28:15', node: 'Site-B', status: 'Active' },
    { ip: '172.16.0.12', attack_type: 'Path Traversal', timestamp: '2026-08-18 01:22:04', node: 'Site-A', status: 'Active' }
  ]
};

export default function App() {
  const [currentView, setCurrentView] = useState('admin'); // 'admin' | 'client'
  const [stats, setStats] = useState(MOCK_FALLBACK.stats);
  const [blocklist, setBlocklist] = useState(MOCK_FALLBACK.blocklist);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isUnbanningIp, setIsUnbanningIp] = useState(null);

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
      // Hub is offline or starting up -> set fallback offline state
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
              attack_type: payload.attack_type || 'Threat Detected',
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
        // SSE will automatically attempt reconnection in browser
      };
    } catch (err) {
      console.error("SSE connection error:", err);
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
      
      // Optimistic UI Update without page reload
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans pb-12">
      
      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        currentView={currentView}
        onSwitchView={setCurrentView}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Offline Banner if FastAPI is down */}
        {!isOnline && (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs font-mono flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span><strong>Connecting to Threat Hub...</strong> Backend is starting or offline at <code>{HUB_API}</code>. Displaying fallback state.</span>
            </div>
            <button 
              onClick={handleManualRefresh}
              className="px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {currentView === 'client' ? (
          <ClientPortal onBackToAdmin={() => setCurrentView('admin')} hubUrl={HUB_API} />
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
      />

    </div>
  );
}
