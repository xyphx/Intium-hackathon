import { useState, useEffect } from 'react';
import { WebSocketMessage, Node, Alert, Event, CloudAIResult } from '../types';
import { getNodes, getAlerts, getEvents } from '../api/client';
import StatCard from '../components/StatCard';
import AlertPanel from '../components/AlertPanel';
import LiveMap from '../components/LiveMap';
import AIPanel from '../components/AIPanel';
import { Activity, Radio, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  wsMessage: WebSocketMessage | null;
}

export default function Dashboard({ wsMessage }: DashboardProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [latestAI, setLatestAI] = useState<CloudAIResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [nodesData, alertsData, eventsData] = await Promise.all([
        getNodes(),
        getAlerts(),
        getEvents()
      ]);
      setNodes(nodesData);
      setAlerts(alertsData);
      setEvents(eventsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'NODE_ONLINE') {
      setNodes(prev => [...prev.filter(n => n.node_id !== wsMessage.data.node_id), wsMessage.data]);
    } else if (wsMessage.type === 'NODE_STATUS_CHANGED') {
      setNodes(prev => prev.map(n => n.node_id === wsMessage.data.node_id ? { ...n, ...wsMessage.data } : n));
    } else if (wsMessage.type === 'NEW_ALERT') {
      setAlerts(prev => [wsMessage.data, ...prev]);
    } else if (wsMessage.type === 'NEW_EVENT') {
      setEvents(prev => [wsMessage.data, ...prev]);
    } else if (wsMessage.type === 'CLOUD_AI_RESULT') {
      setLatestAI(wsMessage.data);
    }
  }, [wsMessage]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading dashboard data...</div>;
  }

  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const criticalEvents = events.filter(e => e.risk_level === 'CRITICAL').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Nodes" value={nodes.length} icon={<Radio className="text-blue-500" />} />
        <StatCard title="Online Nodes" value={onlineNodes} icon={<Activity className="text-green-500" />} />
        <StatCard title="Active Alerts" value={activeAlerts} icon={<AlertTriangle className={activeAlerts > 0 ? "text-yellow-500" : "text-gray-500"} />} />
        <StatCard title="Critical Events" value={criticalEvents} icon={<ShieldAlert className={criticalEvents > 0 ? "text-red-500" : "text-gray-500"} />} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-[500px] relative">
           <LiveMap nodes={nodes} events={events} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-950/50">
            <h2 className="font-semibold text-white tracking-wide">ACTIVE ALERTS</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <AIPanel data={latestAI} />
        </div>
      </div>
    </div>
  );
}
