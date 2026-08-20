import { useState, useEffect } from 'react';
import type { Alert, WebSocketMessage } from '../types';
import { getAlerts, acknowledgeAlert } from '../api/client';
import { formatDistanceToNow } from '../utils';
import clsx from 'clsx';
import { AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, BellRing, Filter } from 'lucide-react';

interface AlertsProps {
  wsMessage?: WebSocketMessage | null;
}

export default function Alerts({ wsMessage }: AlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'ACKNOWLEDGED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'NEW_ALERT') {
      setAlerts(prev => [wsMessage.data, ...prev]);
    } else if (wsMessage.type === 'ALERT_ACKNOWLEDGED') {
      setAlerts(prev => prev.map(a => 
        a.alert_id === wsMessage.data.alert_id ? { ...a, acknowledged: true } : a
      ));
    }
  }, [wsMessage]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => 
        a.alert_id === alertId ? { ...a, acknowledged: true } : a
      ));
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const ackCount = alerts.filter(a => a.acknowledged).length;

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'ACTIVE') return !alert.acknowledged;
    if (filter === 'CRITICAL') return alert.severity === 'critical' && !alert.acknowledged;
    if (filter === 'ACKNOWLEDGED') return alert.acknowledged;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BellRing className="text-yellow-500 w-7 h-7" />
            Security & Environmental Alerts
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time incident dispatch, severity categorization, and operator triage.
          </p>
        </div>
        <button 
          onClick={loadAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Active Alerts</span>
            <span className="text-2xl font-bold text-yellow-400">{activeCount}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-500/40" />
        </div>

        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Critical Threats</span>
            <span className="text-2xl font-bold text-red-400">{criticalCount}</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500/40" />
        </div>

        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Resolved / Ack</span>
            <span className="text-2xl font-bold text-green-400">{ackCount}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-500/40" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-500" />
        {(['ALL', 'ACTIVE', 'CRITICAL', 'ACKNOWLEDGED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
              filter === tab 
                ? "bg-blue-600 text-white"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading alerts feed...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-500/60 mx-auto" />
          <h3 className="text-lg font-semibold text-white">All Clear</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            {filter === 'ALL' 
              ? 'No security or environmental incidents have been triggered yet.'
              : `No alerts found for the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';
            const isMedium = alert.severity === 'medium';

            return (
              <div 
                key={alert.alert_id}
                className={clsx(
                  "p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md",
                  isCritical ? "bg-red-950/20 border-red-900/60" :
                  isHigh ? "bg-orange-950/20 border-orange-900/60" :
                  isMedium ? "bg-yellow-950/20 border-yellow-900/60" :
                  "bg-blue-950/20 border-blue-900/60",
                  alert.acknowledged && "opacity-60 bg-gray-900/30 border-gray-800"
                )}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded text-xs font-extrabold tracking-wider uppercase border",
                      isCritical ? "bg-red-950 text-red-400 border-red-800" :
                      isHigh ? "bg-orange-950 text-orange-400 border-orange-800" :
                      isMedium ? "bg-yellow-950 text-yellow-400 border-yellow-800" :
                      "bg-blue-950 text-blue-400 border-blue-800"
                    )}>
                      {alert.severity}
                    </span>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                      Node: {alert.node_id}
                    </span>

                    <span className="text-xs text-gray-500 ml-auto md:ml-2">
                      {formatDistanceToNow(new Date(alert.created_at))}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">
                    {alert.title}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold px-3 py-1.5 bg-green-950/40 border border-green-800/40 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      disabled={actionLoading === alert.alert_id}
                      className="w-full md:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {actionLoading === alert.alert_id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Acknowledge'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
