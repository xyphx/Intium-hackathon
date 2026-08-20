import type { CloudAIResult } from '../types';
import { Brain, Cpu, ShieldAlert, Activity, GitCommit } from 'lucide-react';

interface AIPanelProps {
  data: CloudAIResult | null;
}

export default function AIPanel({ data }: AIPanelProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 p-8">
        <Brain size={48} className="opacity-20" />
        <p>Waiting for Edge telemetry to begin Cloud AI analysis...</p>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-semibold text-white tracking-wide flex items-center gap-2">
          <Brain className="text-purple-400" size={20} />
          AI INTELLIGENCE
        </h2>
        <span className="text-xs text-gray-500 font-mono">{data.node_id}</span>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Risk Score Highlight */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${getRiskColor(data.risk.level)}`}>
          <div>
            <p className="text-xs font-bold tracking-wider opacity-80 mb-1">GLOBAL RISK SCORE</p>
            <div className="flex items-center gap-2">
              <ShieldAlert size={24} />
              <span className="text-2xl font-black">{data.risk.level}</span>
            </div>
          </div>
          <div className="text-4xl font-black opacity-90">{data.risk.score}<span className="text-xl opacity-50">/100</span></div>
        </div>

        {/* Edge vs Cloud Split */}
        <div className="grid grid-cols-2 gap-4">
          {/* Edge AI */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
              <Cpu size={14} className="text-blue-400" />
              EDGE AI (Perception)
            </h3>
            {data.edge_ai.event ? (
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-300">Detection</span>
                  <span className="font-semibold text-blue-400 capitalize">{data.edge_ai.event.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-300">Confidence</span>
                  <span className="font-mono text-white">{Math.round((data.edge_ai.confidence || 0) * 100)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No edge inference</p>
            )}
          </div>

          {/* Cloud AI */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-xl rounded-full" />
            <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 relative z-10">
              <Brain size={14} className="text-purple-400" />
              CLOUD AI (Reasoning)
            </h3>
            {data.cloud_ai.classification ? (
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-300">Classification</span>
                  <span className="font-semibold text-purple-400 capitalize">{data.cloud_ai.classification.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-300">Confidence</span>
                  <span className="font-mono text-white">{Math.round((data.cloud_ai.confidence || 0) * 100)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic relative z-10">No cloud classification</p>
            )}
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 p-3 rounded-lg">
            <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
              <GitCommit size={12} /> Sensor Fusion
            </h4>
            <div className="text-sm text-gray-300">
              <span className="text-white font-bold">{data.fusion.nodes_confirmed}</span> nodes confirming
            </div>
          </div>
          
          <div className="bg-gray-800/30 p-3 rounded-lg">
            <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
              <Activity size={12} /> Anomaly
            </h4>
            <div className="text-sm">
              {data.anomaly.detected ? (
                <span className="text-red-400 font-semibold text-xs leading-tight block">{data.anomaly.reason}</span>
              ) : (
                <span className="text-green-400">Normal</span>
              )}
            </div>
          </div>
        </div>

        {/* Trend Info */}
        {(data.trend.temperature || data.trend.smoke) && (
          <div className="bg-gray-800/30 p-3 rounded-lg text-sm flex gap-4">
             {data.trend.temperature && (
               <div><span className="text-gray-500 text-xs block">TEMP TREND</span> <span className="capitalize text-gray-300">{data.trend.temperature.replace('_', ' ')}</span></div>
             )}
             {data.trend.smoke && (
               <div><span className="text-gray-500 text-xs block">SMOKE TREND</span> <span className="capitalize text-gray-300">{data.trend.smoke.replace('_', ' ')}</span></div>
             )}
          </div>
        )}

        {/* Explainable AI Evidence */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Explainable AI Evidence</h3>
          <ul className="space-y-2">
            {data.risk.evidence.map((ev, i) => (
              <li key={i} className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded border-l-2 border-purple-500/50 flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-[2px]">✓</span>
                {ev}
              </li>
            ))}
          </ul>
        </div>
        
      </div>
    </div>
  );
}
