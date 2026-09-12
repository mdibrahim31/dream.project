import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PingStats, PingLog } from '../types';
import { 
  Activity, 
  X, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PingStatusModal: React.FC<PingStatusModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<PingStats | null>(null);
  const [logs, setLogs] = useState<PingLog[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getPingLogs();
      setStats(data.stats);
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPingUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ping` : 'http://localhost:3000/api/ping';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Render 24/7 Keep-Alive Monitor</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  HEALTHY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Self-heartbeat + UptimeRobot ping receiver keeps Render free tier alive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Uptime</span>
              <span className="text-base font-black text-white mt-1 block">
                {stats?.uptimeFormatted || '0s'}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Pings</span>
              <span className="text-base font-black text-emerald-400 mt-1 block">
                {stats?.totalPingsReceived || 0}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Memory RSS</span>
              <span className="text-base font-black text-sky-400 mt-1 block">
                {stats?.memoryUsageMb.rss || 0} MB
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Heartbeat</span>
              <span className="text-base font-black text-emerald-400 mt-1 block">
                Active (5m)
              </span>
            </div>
          </div>

          {/* Copyable Ping URL */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">UptimeRobot HTTP Monitor Target:</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <div className="bg-slate-900 px-3 py-2 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800 break-all select-all">
              {currentPingUrl}
            </div>
          </div>

          {/* Recent Ping Log History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recent Inbound Pings & Heartbeats ({logs.length})
              </h4>
              <button
                onClick={fetchLogs}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Awaiting incoming pings... (Ping fires automatically every 5 mins)
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-slate-300">{log.source}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                      <span>{log.durationMs}ms</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
};
