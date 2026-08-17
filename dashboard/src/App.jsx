import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import MetricsBar from './components/MetricsBar';
import ThreatStream from './components/ThreatStream';
import AnalyticsSection from './components/AnalyticsSection';
import BlocklistTable from './components/BlocklistTable';
import SimulatorModal from './components/SimulatorModal';

const HUB_API = 'http://127.0.0.1:8000';

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
        axios.get(`${HUB_API}/stats`, { timeout: 2500 }),
        axios.get(`${HUB_API}/blocklist`, { timeout: 2500 })
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

  // Initial load + Automatic 3-Second Background Polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Unban / Revoke IP Action handler
  const handleUnbanIp = async (ip) => {
    setIsUnbanningIp(ip);
    try {
      if (isOnline) {
        await axios.delete(`${HUB_API}/unban/${encodeURIComponent(ip)}`);
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
              <span><strong>Connecting to Threat Hub...</strong> FastAPI Hub backend is starting or offline at <code>http://127.0.0.1:8000</code>. Displaying live mock state.</span>
            </div>
            <button 
              onClick={handleManualRefresh}
              className="px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

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

      </main>

      {/* 5. Client / Spoke Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRefreshData={fetchData}
      />

    </div>
  );
}
