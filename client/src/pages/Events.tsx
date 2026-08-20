import { useState, useEffect } from 'react';
import { Event } from '../types';
import { getEvents } from '../api/client';
import { formatDistanceToNow } from '../utils';
import clsx from 'clsx';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading events...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Event Timeline</h1>
      
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500">No events recorded.</p>
        ) : (
          events.map(event => (
            <div key={event.event_id} className="flex gap-4 items-start bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className={clsx(
                "p-3 rounded-full shrink-0",
                event.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-500' :
                event.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-500' :
                event.risk_level === 'MEDIUM' ? 'bg-yellow-950 text-yellow-500' :
                'bg-blue-950 text-blue-500'
              )}>
                {event.risk_level === 'CRITICAL' ? <ShieldAlert className="w-6 h-6" /> :
                 event.risk_level === 'HIGH' ? <AlertTriangle className="w-6 h-6" /> :
                 event.risk_level === 'MEDIUM' ? <AlertCircle className="w-6 h-6" /> :
                 <Info className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg text-white">
                    {event.event_type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(event.timestamp))}
                  </span>
                </div>
                <div className="text-sm text-gray-400 flex flex-wrap gap-4 mt-2">
                  <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">Node: {event.node_id}</span>
                  <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">Risk Score: {event.risk_score}</span>
                  {event.confidence && (
                    <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">Confidence: {event.confidence * 100}%</span>
                  )}
                  {event.confirmed && (
                    <span className="bg-green-900/50 text-green-400 border border-green-800 px-2 py-1 rounded-md">Verified</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
