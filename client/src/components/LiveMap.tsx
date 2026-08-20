import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Shield, Flame, Navigation, AlertOctagon, ChevronRight, Eye, EyeOff, Minimize2, Maximize2, Layers } from 'lucide-react';
import type { Node, Event, Alert, CloudAIResult } from '../types';

interface LiveMapProps {
  nodes: Node[];
  events: Event[];
  alerts?: Alert[];
  aiResult?: CloudAIResult | null;
}

// Fallback base coordinates (Department of Applied Electronics, CET)
const DEFAULT_LAT = 8.5444327;
const DEFAULT_LON = 76.9051745;

export interface DynamicRoute {
  id: string;
  name: string;
  destination: string;
  color: string;
  glowColor: string;
  distance: string;
  eta: string;
  safeCoords: [number, number];
  safeName: string;
  description: string;
  waypoints: { name: string; desc: string; coords: [number, number] }[];
}

// Function to generate dynamic evacuation routes from any given origin (lon, lat)
function generateRoutesFromOrigin(originLon: number, originLat: number, nodeName = 'Current Location'): DynamicRoute[] {
  return [
    {
      id: 'route-1',
      name: 'Route 1 (Primary - North)',
      destination: 'CET Main Open Assembly Ground',
      color: '#22c55e',
      glowColor: '#4ade80',
      distance: '520m',
      eta: '4.2 mins',
      safeCoords: [originLon - 0.0030, originLat + 0.0034],
      safeName: 'Safe Haven Alpha (North Ground)',
      description: 'Primary open assembly area equipped with emergency triage & medical relief.',
      waypoints: [
        { name: `Hazard Origin (${nodeName})`, desc: 'Immediate evacuation from threatened structure', coords: [originLon, originLat] },
        { name: 'Checkpoint 1 (Exit Corridor)', desc: 'Move towards clear northern access way', coords: [originLon - 0.0006, originLat + 0.0008] },
        { name: 'Checkpoint 2 (Central Campus Link)', desc: 'Follow illuminated green corridor bypassing academic blocks', coords: [originLon - 0.0014, originLat + 0.0017] },
        { name: 'Checkpoint 3 (Safety Lane)', desc: 'Take open avenue towards outer sports ground', coords: [originLon - 0.0022, originLat + 0.0025] },
        { name: 'Safe Haven Alpha', desc: 'Main Open Assembly Ground & Medical Relief Station', coords: [originLon - 0.0030, originLat + 0.0034] }
      ]
    },
    {
      id: 'route-2',
      name: 'Route 2 (West Bypass - Fastest)',
      destination: 'Kulathoor West Bypass Gate',
      color: '#06b6d4',
      glowColor: '#38bdf8',
      distance: '410m',
      eta: '3.3 mins',
      safeCoords: [originLon - 0.0037, originLat + 0.0007],
      safeName: 'Safe Haven Beta (West Gate)',
      description: 'Fastest arterial exit passage onto Kulathoor bypass road.',
      waypoints: [
        { name: `Hazard Origin (${nodeName})`, desc: 'Exit structure towards West Parking avenue', coords: [originLon, originLat] },
        { name: 'West Parking Lane', desc: 'Proceed along boundary perimeter road', coords: [originLon - 0.0010, originLat + 0.0002] },
        { name: 'Bypass Access Way', desc: 'Direct passage towards western perimeter barrier', coords: [originLon - 0.0024, originLat + 0.0004] },
        { name: 'Safe Haven Beta', desc: 'Kulathoor West Bypass Open Assembly Area', coords: [originLon - 0.0037, originLat + 0.0007] }
      ]
    },
    {
      id: 'route-3',
      name: 'Route 3 (East Perimeter)',
      destination: 'Sreekaryam East Access Gate',
      color: '#f59e0b',
      glowColor: '#fbbf24',
      distance: '460m',
      eta: '3.8 mins',
      safeCoords: [originLon + 0.0028, originLat + 0.0009],
      safeName: 'Safe Haven Gamma (East Gate)',
      description: 'Eastern campus exit corridor connecting to Sreekaryam - Akkulam Road.',
      waypoints: [
        { name: `Hazard Origin (${nodeName})`, desc: 'Exit structure towards East Lane avenue', coords: [originLon, originLat] },
        { name: 'East Campus Access', desc: 'Proceed along Ambady Nagar connecting corridor', coords: [originLon + 0.0008, originLat + 0.0002] },
        { name: 'Outer Avenue', desc: 'Follow open corridor towards eastern gate', coords: [originLon + 0.0018, originLat + 0.0005] },
        { name: 'Safe Haven Gamma', desc: 'East Perimeter Safe Assembly Zone', coords: [originLon + 0.0028, originLat + 0.0009] }
      ]
    }
  ];
}

export default function LiveMap({ nodes, events, alerts = [], aiResult }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [showSteps, setShowSteps] = useState(false);
  const [routeVisible, setRouteVisible] = useState(true);
  const [hudMinimized, setHudMinimized] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // 1. Detect critical threats and identify threatened node(s)
  const criticalAlerts = alerts.filter(
    a => (a.severity?.toLowerCase() === 'critical' || a.title?.toLowerCase().includes('critical')) && !a.acknowledged
  );
  const criticalEvents = events.filter(
    e => e.risk_level?.toUpperCase() === 'CRITICAL' && e.status !== 'resolved'
  );
  const isAiCritical = aiResult?.risk?.level?.toUpperCase() === 'CRITICAL';
  const hasCriticalThreat = criticalAlerts.length > 0 || criticalEvents.length > 0 || isAiCritical || alerts.length > 0;

  // Determine threat node from active alerts, events, AI, or latest nodes
  const threatNodeId = criticalAlerts[0]?.node_id || criticalEvents[0]?.node_id || aiResult?.node_id || (nodes[0]?.node_id ?? 'NODE-01');
  const activeThreatNode = nodes.find(n => n.node_id === threatNodeId && n.location) || 
                           nodes.find(n => n.location) || 
                           nodes[0];

  const originLon = activeThreatNode?.location?.longitude ?? DEFAULT_LON;
  const originLat = activeThreatNode?.location?.latitude ?? DEFAULT_LAT;
  const originNodeName = activeThreatNode?.name || activeThreatNode?.node_id || 'NODE-01';

  // Dynamically calculate evacuation routes from current threat origin
  const dynamicRoutes = generateRoutesFromOrigin(originLon, originLat, originNodeName);

  // Projected 2D screen positions state
  const [projectedData, setProjectedData] = useState<{
    origin: { x: number; y: number };
    routes: {
      id: string;
      color: string;
      glowColor: string;
      name: string;
      safeName: string;
      safePoint: { x: number; y: number };
      pathD: string;
      waypoints: { name: string; desc: string; point: { x: number; y: number } }[];
    }[];
    nodes: { id: string; name: string; point: { x: number; y: number }; status: string; isCritical: boolean }[];
  } | null>(null);

  // Project coordinates to screen pixels
  const updateProjectedPositions = useCallback(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    try {
      const originPoint = currentMap.project([originLon, originLat]);

      const projectedRoutes = dynamicRoutes.map(route => {
        const safePoint = currentMap.project(route.safeCoords);
        const waypoints = route.waypoints.map(w => ({
          name: w.name,
          desc: w.desc,
          point: currentMap.project(w.coords)
        }));

        const pathD = waypoints.reduce((acc, wp, idx) => {
          return `${acc} ${idx === 0 ? 'M' : 'L'} ${wp.point.x.toFixed(1)} ${wp.point.y.toFixed(1)}`;
        }, '');

        return {
          id: route.id,
          color: route.color,
          glowColor: route.glowColor,
          name: route.name,
          safeName: route.safeName,
          safePoint,
          pathD,
          waypoints
        };
      });

      const projectedNodes = (nodes.length > 0 ? nodes : [
        { node_id: 'NODE-01', name: 'Sensor Node 01', location: { longitude: originLon, latitude: originLat }, status: 'online' } as Node
      ]).map(n => {
        const lon = n.location?.longitude ?? originLon;
        const lat = n.location?.latitude ?? originLat;
        const point = currentMap.project([lon, lat]);
        const isCritical = n.node_id === threatNodeId && hasCriticalThreat;
        return {
          id: n.node_id,
          name: n.name,
          point,
          status: n.status,
          isCritical
        };
      });

      setProjectedData({
        origin: originPoint,
        routes: projectedRoutes,
        nodes: projectedNodes
      });
    } catch (e) {
      console.error("Error updating projected positions:", e);
    }
  }, [originLon, originLat, dynamicRoutes, nodes, threatNodeId, hasCriticalThreat]);

  // Re-center and fit bounds covering the current origin and all routes
  const fitEvacuationBounds = useCallback(() => {
    if (!map.current) return;
    try {
      const bounds = new LngLatBounds();
      bounds.extend([originLon, originLat]);
      dynamicRoutes.forEach(r => {
        bounds.extend(r.safeCoords);
        r.waypoints.forEach(w => bounds.extend(w.coords));
      });

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 16.5,
        duration: 1000
      });
    } catch (e) {
      console.error("Error fitting bounds:", e);
    }
  }, [originLon, originLat, dynamicRoutes]);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapStyle = {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    const instance = new Map({
      container: mapContainer.current,
      style: mapStyle as any,
      center: [originLon, originLat],
      zoom: 15.8
    });

    instance.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    const handleReady = () => {
      setMapLoaded(true);
      updateProjectedPositions();
    };

    instance.on('load', handleReady);
    instance.on('move', updateProjectedPositions);
    instance.on('zoom', updateProjectedPositions);
    instance.on('resize', updateProjectedPositions);

    map.current = instance;

    return () => {
      instance.off('move', updateProjectedPositions);
      instance.off('zoom', updateProjectedPositions);
      instance.off('resize', updateProjectedPositions);
      instance.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Sync positions on state/data changes
  useEffect(() => {
    if (mapLoaded) {
      updateProjectedPositions();
    }
  }, [mapLoaded, nodes, events, alerts, aiResult, selectedRouteId, updateProjectedPositions]);

  // Auto-focus escape path on load or threat change
  useEffect(() => {
    if (mapLoaded && hasCriticalThreat && routeVisible) {
      fitEvacuationBounds();
    }
  }, [mapLoaded, hasCriticalThreat, routeVisible, fitEvacuationBounds]);

  const activeRoute = dynamicRoutes.find(r => r.id === selectedRouteId) || dynamicRoutes[0];

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none">
      {/* Map Canvas Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-gray-950" />

      {/* High-Precision Interactive SVG Evacuation Path Overlay */}
      {mapLoaded && projectedData && hasCriticalThreat && routeVisible && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Hazard Exclusion Radius (200m) at Current Location */}
          <circle
            cx={projectedData.origin.x}
            cy={projectedData.origin.y}
            r="80"
            fill="rgba(239, 68, 68, 0.20)"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <circle
            cx={projectedData.origin.x}
            cy={projectedData.origin.y}
            r="45"
            fill="rgba(239, 68, 68, 0.35)"
            className="animate-ping"
            style={{ transformOrigin: `${projectedData.origin.x}px ${projectedData.origin.y}px` }}
          />

          {/* 2. Render Evacuation Routes */}
          {projectedData.routes.map(r => {
            const isVisible = selectedRouteId === 'all' || selectedRouteId === r.id;
            if (!isVisible) return null;

            return (
              <g key={r.id}>
                {/* Safe Haven Perimeter */}
                <circle
                  cx={r.safePoint.x}
                  cy={r.safePoint.y}
                  r="45"
                  fill={r.id === 'route-1' ? 'rgba(34, 197, 94, 0.20)' : r.id === 'route-2' ? 'rgba(6, 182, 212, 0.20)' : 'rgba(245, 158, 11, 0.20)'}
                  stroke={r.color}
                  strokeWidth="2"
                />

                {/* Dark High-Contrast Casing */}
                <path
                  d={r.pathD}
                  fill="none"
                  stroke="#020617"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.95"
                />

                {/* Neon Glow Layer */}
                <path
                  d={r.pathD}
                  fill="none"
                  stroke={r.glowColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={r.id === 'route-1' ? 'url(#glow-green)' : r.id === 'route-2' ? 'url(#glow-cyan)' : 'url(#glow-amber)'}
                  opacity="0.85"
                />

                {/* Animated Core Flow Line */}
                <path
                  d={r.pathD}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="12 8"
                  className="animate-dash-flow"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* HTML Interactive Badges Overlay (Anchored to projected coordinates) */}
      {mapLoaded && projectedData && hasCriticalThreat && routeVisible && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {/* A. Hazard Epicenter Badge at Current Location */}
          <div
            className="absolute pointer-events-auto cursor-pointer transition-transform hover:scale-110"
            style={{
              left: `${projectedData.origin.x}px`,
              top: `${projectedData.origin.y}px`,
              transform: 'translate(-50%, -100%) translateY(-8px)'
            }}
            onClick={() => setActiveTooltip(activeTooltip === 'origin' ? null : 'origin')}
          >
            <div className="flex items-center gap-1.5 bg-red-950 text-red-200 border-2 border-red-500 text-[11px] font-black px-3 py-1.5 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.95)] backdrop-blur-md whitespace-nowrap">
              <span className="text-sm animate-bounce">🔥</span>
              <span>HAZARD EPICENTER: {originNodeName.toUpperCase()}</span>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 mx-auto -mt-[1px]" />

            {activeTooltip === 'origin' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-red-500 rounded-lg p-2.5 shadow-2xl text-xs text-white z-50">
                <div className="font-bold text-red-400 border-b border-gray-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Hazard Location: {originNodeName}</span>
                </div>
                <p className="text-[11px] text-red-200 mb-1">Critical emergency detected at this location. Evacuate immediately!</p>
                <div className="text-[10px] text-gray-400">Coordinates: {originLat.toFixed(4)}° N, {originLon.toFixed(4)}° E</div>
              </div>
            )}
          </div>

          {/* B. Safe Haven Badges */}
          {projectedData.routes.map(r => {
            const isVisible = selectedRouteId === 'all' || selectedRouteId === r.id;
            if (!isVisible) return null;

            return (
              <div
                key={`safe-${r.id}`}
                className="absolute pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                style={{
                  left: `${r.safePoint.x}px`,
                  top: `${r.safePoint.y}px`,
                  transform: 'translate(-50%, -100%) translateY(-8px)'
                }}
                onClick={() => setActiveTooltip(activeTooltip === r.id ? null : r.id)}
              >
                <div
                  className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full backdrop-blur-md whitespace-nowrap shadow-xl"
                  style={{
                    backgroundColor: r.id === 'route-1' ? '#052e16' : r.id === 'route-2' ? '#082f49' : '#451a03',
                    color: r.color,
                    border: `2px solid ${r.color}`,
                    boxShadow: `0 0 20px ${r.glowColor}`
                  }}
                >
                  <span className="text-sm">🛡️</span>
                  <span>{r.safeName.toUpperCase()}</span>
                </div>
                <div
                  className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent mx-auto -mt-[1px]"
                  style={{ borderTopColor: r.color }}
                />

                {activeTooltip === r.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-2xl text-xs text-white z-50">
                    <div className="font-bold border-b border-gray-800 pb-1 mb-1.5 flex items-center gap-1.5" style={{ color: r.color }}>
                      <Shield className="w-3.5 h-3.5" />
                      <span>{r.safeName}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 mb-1.5">{dynamicRoutes.find(x => x.id === r.id)?.description}</p>
                    <div className="text-[10px] text-green-400 font-semibold">STATUS: CLEAR & OPEN TO EVACUEES</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* C. Waypoint Checkpoint Number Badges */}
          {projectedData.routes.map(r => {
            const isVisible = selectedRouteId === 'all' || selectedRouteId === r.id;
            if (!isVisible) return null;

            return r.waypoints.slice(1, -1).map((wp, idx) => (
              <div
                key={`wp-${r.id}-${idx}`}
                className="absolute pointer-events-auto cursor-pointer flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black shadow-lg transition-transform hover:scale-125"
                style={{
                  left: `${wp.point.x}px`,
                  top: `${wp.point.y}px`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#0f172a',
                  color: r.color,
                  border: `2px solid ${r.color}`,
                  boxShadow: `0 0 10px ${r.glowColor}`
                }}
                title={`${wp.name}: ${wp.desc}`}
              >
                {idx + 1}
              </div>
            ));
          })}

          {/* D. Other Online Nodes */}
          {projectedData.nodes.filter(n => n.id !== threatNodeId).map(n => (
            <div
              key={`node-${n.id}`}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${n.point.x}px`,
                top: `${n.point.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
              title={`${n.name} (${n.id}) - Status: ${n.status}`}
            >
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Critical Threat & Multi-Route Evacuation HUD Banner */}
      {hasCriticalThreat && (
        <div className={`absolute top-3 left-3 z-30 ${hudMinimized ? 'w-auto' : 'max-w-xs sm:max-w-sm'} bg-gray-950/94 border border-red-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-white transition-all`}>
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-red-900/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h3 className="font-extrabold text-red-400 text-xs tracking-wider uppercase flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>{hudMinimized ? 'Evacuation' : 'Critical Threat Evacuation'}</span>
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setRouteVisible(!routeVisible)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                title={routeVisible ? 'Hide Escape Route' : 'Show Escape Route'}
              >
                {routeVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setHudMinimized(!hudMinimized)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                title={hudMinimized ? 'Expand HUD' : 'Minimize HUD'}
              >
                {hudMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!hudMinimized && (
            <>
              {/* Route Selector Tabs */}
              <div className="mt-2 flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-[10px]">
                <button
                  onClick={() => setSelectedRouteId('all')}
                  className={`flex-1 py-1 px-1.5 rounded font-semibold transition-colors ${selectedRouteId === 'all' ? 'bg-red-950 text-red-300 border border-red-500/50' : 'text-gray-400 hover:text-white'}`}
                >
                  All Routes
                </button>
                {dynamicRoutes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`py-1 px-2 rounded font-semibold transition-colors ${selectedRouteId === r.id ? 'bg-gray-800 text-white border border-gray-600' : 'text-gray-400 hover:text-white'}`}
                    style={{ color: selectedRouteId === r.id ? r.color : undefined }}
                  >
                    {r.name.split(' ')[1]}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Current Origin:</span>
                  <span className="font-bold text-red-300 font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-500" />
                    {originNodeName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Safe Destination:</span>
                  <span className="font-bold flex items-center gap-1" style={{ color: selectedRouteId === 'all' ? '#4ade80' : activeRoute.color }}>
                    <Shield className="w-3 h-3" />
                    {selectedRouteId === 'all' ? '3 Safe Havens Active' : activeRoute.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Distance / ETA:</span>
                  <span className="font-mono text-gray-200">
                    {selectedRouteId === 'all' ? '410m – 520m • 3.3 – 4.2 mins' : `${activeRoute.distance} • ~${activeRoute.eta}`}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-gray-800">
                <button
                  onClick={fitEvacuationBounds}
                  className="flex-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-red-400" />
                  Center Escape Routes
                </button>
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium py-1.5 px-2.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{showSteps ? 'Hide' : 'Steps'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Turn-by-Turn Guidance */}
              {showSteps && (
                <div className="mt-2.5 pt-2 border-t border-gray-800/80 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {selectedRouteId === 'all' ? 'Route 1 Checkpoints (Primary):' : `${activeRoute.name} Checkpoints:`}
                  </p>
                  {activeRoute.waypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] bg-gray-900/60 p-1.5 rounded border border-gray-800">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${idx === 0 ? 'bg-red-500/20 text-red-400 border border-red-500' : idx === activeRoute.waypoints.length - 1 ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'}`}>
                        {idx === 0 ? '!' : idx === activeRoute.waypoints.length - 1 ? '✓' : idx}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200 text-[10px]">{wp.name}</div>
                        <div className="text-[9px] text-gray-400">{wp.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-30 bg-gray-950/85 border border-gray-800/80 rounded-lg p-2.5 backdrop-blur-md text-[10px] text-gray-300 shadow-xl space-y-1.5">
        <div className="font-semibold text-gray-400 uppercase tracking-wider text-[9px] pb-1 border-b border-gray-800 flex items-center gap-1">
          <Layers className="w-3 h-3 text-gray-400" />
          <span>Active Evacuation Network</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-300"></div>
          <span>Hazard Epicenter: {originNodeName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-green-400 rounded-full"></div>
          <span>Route 1: North Safe Ground (520m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-cyan-400 rounded-full"></div>
          <span>Route 2: West Bypass Gate (410m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-amber-400 rounded-full"></div>
          <span>Route 3: East Perimeter Gate (460m)</span>
        </div>
      </div>
    </div>
  );
}
