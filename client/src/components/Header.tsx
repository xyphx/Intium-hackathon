import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';

interface HeaderProps {
  wsStatus: 'CONNECTING' | 'LIVE' | 'DISCONNECTED';
}

export default function Header({ wsStatus }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-blue-500" />
              <span className="font-bold text-xl tracking-wider text-white">XyphX <span className="text-blue-500">SENTINEL</span></span>
            </Link>
            
            <nav className="hidden md:flex gap-4 ml-6">
              <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
              <Link to="/nodes" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Nodes</Link>
              <Link to="/events" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Events</Link>
              <Link to="/alerts" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Alerts</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-700">
            {wsStatus === 'LIVE' ? (
              <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
            ) : wsStatus === 'CONNECTING' ? (
              <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={clsx(
              "text-xs font-bold tracking-wider",
              wsStatus === 'LIVE' ? 'text-green-500' : 
              wsStatus === 'CONNECTING' ? 'text-yellow-500' : 'text-red-500'
            )}>
              {wsStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
