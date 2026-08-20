import { useState, useEffect } from 'react';
import type { Node, WebSocketMessage, SensorReading } from '../types';
import { getNodes, getSensorReadings } from '../api/client';
import { formatDistanceToNow } from '../utils';
import clsx from 'clsx';
import { Radio, Activity, Battery, MapPin, Cpu, Flame, Droplets, Wind, ShieldCheck, RefreshCw } from 'lucide-react';

interface NodesProps {
  wsMessage?: WebSocketMessage | null;
}

export default function Nodes({ wsMessage }: NodesProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nodesData, readingsData] = await Promise.all([
        getNodes(),
        getSensorReadings(100)
      ]);
      setNodes(nodesData);
      
      const latestMap: Record<string, SensorReading> = {};
      readingsData.forEach(r => {
        if (!latestMap[r.node_id] || new Date(r.timestamp) > new Date(latestMap[r.node_id].timestamp)) {
          latestMap[r.node_id] = r;
        }
      });
      setReadings(latestMap);
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
    } else if (wsMessage.type === 'SENSOR_UPDATE') {
      const data: SensorReading = wsMessage.data;
      setReadings(prev => ({
        ...prev,
        [data.node_id]: data
      }));
      setNodes(prev => prev.map(n => {
        if (n.node_id === data.node_id) {
          return {
            ...n,
            status: 'online',
            last_seen: data.timestamp,
            battery: data.battery ?? n.battery
          };
        }
        return n;
      }));
    }
  }, [wsMessage]);

  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="text-blue-500 w-7 h-7" />
            Sensor Nodes Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time telemetry, network health, and edge hardware diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950/40 border border-green-800/50 rounded-lg text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {onlineNodes} / {nodes.length} Online
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading sensor nodes...</div>
      ) : nodes.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center space-y-3">
          <Cpu className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Nodes Registered</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Waiting for edge microcontrollers (ESP32/Raspberry Pi) to broadcast their telemetry. Once online, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map(node => {
            const telemetry = readings[node.node_id];
            const isOnline = node.status === 'online';

            return (
              <div 
                key={node.node_id}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all flex flex-col justify-between shadow-lg"
              >
                {/* Top Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-800/50">
                          {node.node_id}
                        </span>
                        <h3 className="font-bold text-lg text-white">
                          {node.name || `Node ${node.node_id}`}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {node.location 
                          ? `${node.location.latitude.toFixed(4)}°, ${node.location.longitude.toFixed(4)}°`
                          : 'Coordinates pending...'}
                      </p>
                    </div>

                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border",
                      isOnline 
                        ? "bg-green-950/40 text-green-400 border-green-800/50"
                        : "bg-red-950/40 text-red-400 border-red-800/50"
                    )}>
                      <span className={clsx("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-400 animate-pulse" : "bg-red-400")}></span>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1.5">
                    {node.capabilities && node.capabilities.length > 0 ? (
                      node.capabilities.map(cap => (
                        <span key={cap} className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700/50 capitalize">
                          {cap}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-400">
                        Default Sensors
                      </span>
                    )}
                  </div>

                  {/* Live Telemetry Card */}
                  <div className="bg-gray-950/60 border border-gray-800/70 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      Live Readings
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {telemetry?.temperature !== undefined && telemetry?.temperature !== null && (
                        <div className="flex items-center gap-2 p-1.5 rounded bg-gray-900/50 border border-gray-800/50">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <div>
                            <span className="text-xs text-gray-400 block">Temp</span>
                            <span className="font-bold text-white">{telemetry.temperature}°C</span>
                          </div>
                        </div>
                      )}

                      {telemetry?.smoke !== undefined && telemetry?.smoke !== null && (
                        <div className="flex items-center gap-2 p-1.5 rounded bg-gray-900/50 border border-gray-800/50">
                          <Wind className="w-4 h-4 text-yellow-400" />
                          <div>
                            <span className="text-xs text-gray-400 block">Smoke</span>
                            <span className="font-bold text-white">{telemetry.smoke} ppm</span>
                          </div>
                        </div>
                      )}

                      {telemetry?.humidity !== undefined && telemetry?.humidity !== null && (
                        <div className="flex items-center gap-2 p-1.5 rounded bg-gray-900/50 border border-gray-800/50">
                          <Droplets className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="text-xs text-gray-400 block">Humidity</span>
                            <span className="font-bold text-white">{telemetry.humidity}%</span>
                          </div>
                        </div>
                      )}

                      {node.battery !== undefined && node.battery !== null && (
                        <div className="flex items-center gap-2 p-1.5 rounded bg-gray-900/50 border border-gray-800/50">
                          <Battery className="w-4 h-4 text-green-400" />
                          <div>
                            <span className="text-xs text-gray-400 block">Battery</span>
                            <span className="font-bold text-white">{node.battery}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
                  <span>Last Seen: {node.last_seen ? formatDistanceToNow(new Date(node.last_seen)) : 'Never'}</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Edge AI Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
