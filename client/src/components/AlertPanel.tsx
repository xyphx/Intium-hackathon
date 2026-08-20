import type { Alert } from '../types';
import clsx from 'clsx';
import { formatDistanceToNow } from '../utils';

interface AlertPanelProps {
  alerts: Alert[];
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  if (alerts.length === 0) {
    return <div className="text-gray-500 text-center py-10">No active alerts.</div>;
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div 
          key={alert.alert_id} 
          className={clsx(
            "p-4 rounded-lg border shadow-sm transition-all",
            alert.severity === 'critical' ? 'bg-red-950/30 border-red-900/50' : 
            alert.severity === 'high' ? 'bg-orange-950/30 border-orange-900/50' :
            alert.severity === 'medium' ? 'bg-yellow-950/30 border-yellow-900/50' :
            'bg-blue-950/30 border-blue-900/50',
            alert.acknowledged && 'opacity-50'
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className={clsx(
              "font-bold tracking-wide text-sm",
              alert.severity === 'critical' ? 'text-red-400' : 
              alert.severity === 'high' ? 'text-orange-400' :
              alert.severity === 'medium' ? 'text-yellow-400' :
              'text-blue-400'
            )}>
              {alert.severity.toUpperCase()} ALERT
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {formatDistanceToNow(new Date(alert.created_at))}
            </span>
          </div>
          <p className="font-medium text-white mb-1">{alert.title}</p>
          <p className="text-sm text-gray-400 mb-3">{alert.message}</p>
          
          {!alert.acknowledged && (
            <button className="text-xs font-semibold px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors border border-gray-700">
              Acknowledge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
