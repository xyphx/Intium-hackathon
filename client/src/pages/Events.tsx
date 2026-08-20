import { useState, useEffect } from 'react';
import type { Event, WebSocketMessage } from '../types';
import { getEvents } from '../api/client';
import { formatDistanceToNow } from '../utils';
import clsx from 'clsx';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, RefreshCw, Activity } from 'lucide-react';

interface EventsProps {
  wsMessage?: WebSocketMessage | null;
}

export default function Events({ wsMessage }: EventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'NEW_EVENT') {
      setEvents(prev => [wsMessage.data, ...prev]);
    }
  }, [wsMessage]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500 w-7 h-7" />
            Security & Environmental Timeline
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Chronological audit log of AI-classified anomalies and threshold breaches.
          </p>
        </div>
        <button 
          onClick={loadEvents}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading events timeline...</div>
      ) : events.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-12 text-center space-y-3">
          <Info className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Events Recorded</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            AI risk classification engine has not logged any severe anomalies or security events yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div 
              key={event.event_id} 
              className="flex gap-4 items-start bg-gray-900/80 border border-gray-800 p-4 rounded-xl shadow-md hover:border-gray-700 transition-colors"
            >
              <div className={clsx(
                "p-3 rounded-xl shrink-0 border",
                event.risk_level === 'CRITICAL' ? 'bg-red-950/60 text-red-400 border-red-800/60' :
                event.risk_level === 'HIGH' ? 'bg-orange-950/60 text-orange-400 border-orange-800/60' :
                event.risk_level === 'MEDIUM' ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/60' :
                'bg-blue-950/60 text-blue-400 border-blue-800/60'
              )}>
                {event.risk_level === 'CRITICAL' ? <ShieldAlert className="w-6 h-6" /> :
                 event.risk_level === 'HIGH' ? <AlertTriangle className="w-6 h-6" /> :
                 event.risk_level === 'MEDIUM' ? <AlertCircle className="w-6 h-6" /> :
                 <Info className="w-6 h-6" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-white truncate">
                    {event.event_type.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDistanceToNow(new Date(event.timestamp))}
                  </span>
                </div>

                <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-gray-800 px-2.5 py-1 rounded-md text-gray-200 border border-gray-700 font-mono">
                    Node: {event.node_id}
                  </span>
                  <span className={clsx(
                    "px-2.5 py-1 rounded-md font-semibold border",
                    event.risk_level === 'CRITICAL' ? 'bg-red-950/40 text-red-300 border-red-800/50' :
                    event.risk_level === 'HIGH' ? 'bg-orange-950/40 text-orange-300 border-orange-800/50' :
                    event.risk_level === 'MEDIUM' ? 'bg-yellow-950/40 text-yellow-300 border-yellow-800/50' :
                    'bg-blue-950/40 text-blue-300 border-blue-800/50'
                  )}>
                    Risk Score: {event.risk_score}/100
                  </span>
                  {event.confidence !== undefined && (
                    <span className="bg-gray-800 px-2.5 py-1 rounded-md text-gray-300 border border-gray-700">
                      Confidence: {Math.round(event.confidence * 100)}%
                    </span>
                  )}
                  {event.confirmed && (
                    <span className="bg-green-950/40 text-green-400 border border-green-800 px-2.5 py-1 rounded-md font-semibold">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
