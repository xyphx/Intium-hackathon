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

// Exact Coordinates
const DEPT_APPLIED_ELECTRONICS_LON = 76.9051745;
const DEPT_APPLIED_ELECTRONICS_LAT = 8.5444327;

export interface EvacuationRoute {
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

const EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: 'route-1',
    name: 'Route 1 (Primary - North)',
    destination: 'CET Main Open Assembly Ground',
    color: '#22c55e',
    glowColor: '#4ade80',
    distance: '540m',
    eta: '4.5 mins',
    safeCoords: [76.90220, 8.54780],
    safeName: 'Safe Haven Alpha (CET Ground)',
    description: 'Wide-open main sports ground with emergency medical triage station.',
    waypoints: [
      { name: 'Hazard Origin', desc: 'Exit Dept of Applied Electronics via North Bus Bay door', coords: [DEPT_APPLIED_ELECTRONICS_LON, DEPT_APPLIED_ELECTRONICS_LAT] },
      { name: 'Bus Bay Exit Gate', desc: 'Pass Bus Bay terminal onto northern access road', coords: [76.90508, 8.54495] },
      { name: 'CET Central Link Road', desc: 'Proceed along Central Ring Road towards West Quad', coords: [76.90445, 8.54565] },
      { name: 'Electrical & Electronics Quad', desc: 'Green corridor bypassing academic blocks', coords: [76.90360, 8.54650] },
      { name: 'North Avenue Safety Lane', desc: 'Open safety avenue reaching Outdoor Sports Ground', coords: [76.90280, 8.54720] },
      { name: 'Safe Haven Alpha', desc: 'CET Main Open Assembly Ground & Medical Relief', coords: [76.90220, 8.54780] }
    ]
  },
  {
    id: 'route-2',
    name: 'Route 2 (West Bypass - Fastest)',
    destination: 'Kulathoor West Bypass Gate',
    color: '#06b6d4',
    glowColor: '#38bdf8',
    distance: '430m',
    eta: '3.5 mins',
    safeCoords: [76.90150, 8.54510],
    safeName: 'Safe Haven Beta (Kulathoor West Gate)',
    description: 'Direct western arterial exit passage onto Kulathoor bypass road.',
    waypoints: [
      { name: 'Hazard Origin', desc: 'Exit Dept of Applied Electronics via West Parking door', coords: [DEPT_APPLIED_ELECTRONICS_LON, DEPT_APPLIED_ELECTRONICS_LAT] },
      { name: 'West Parking Lane', desc: 'Follow West parking road clear of building structures', coords: [76.90480, 8.54450] },
      { name: 'Applied Mechanics Link', desc: 'Clear perimeter lane along boundary wall', coords: [76.90380, 8.54460] },
      { name: 'West Gate Access Way', desc: 'Straight passage towards Kulathoor Road exit', coords: [76.90260, 8.54480] },
      { name: 'Safe Haven Beta', desc: 'Kulathoor West Bypass Open Assembly Area', coords: [76.90150, 8.54510] }
    ]
  },
  {
    id: 'route-3',
    name: 'Route 3 (East Perimeter)',
    destination: 'Sreekaryam - Akkulam East Gate',
    color: '#f59e0b',
    glowColor: '#fbbf24',
    distance: '470m',
    eta: '4.0 mins',
    safeCoords: [76.90800, 8.54530],
    safeName: 'Safe Haven Gamma (East Gate)',
    description: 'Eastern campus exit corridor leading to Sreekaryam - Akkulam Main Road.',
    waypoints: [
      { name: 'Hazard Origin', desc: 'Exit Dept of Applied Electronics towards East Lane', coords: [DEPT_APPLIED_ELECTRONICS_LON, DEPT_APPLIED_ELECTRONICS_LAT] },
      { name: 'East Campus Access', desc: 'Proceed along Ambady Nagar connecting lane', coords: [76.90560, 8.54430] },
      { name: 'Ambady Nagar Avenue', desc: 'Follow open corridor towards eastern perimeter', coords: [76.90650, 8.54450] },
      { name: 'Sreekaryam Gate Approach', desc: 'Direct access lane to eastern main road', coords: [76.90740, 8.54490] },
      { name: 'Safe Haven Gamma', desc: 'East Perimeter Safe Assembly Zone', coords: [76.90800, 8.54530] }
    ]
  }
];

export default function LiveMap({ nodes, events, alerts = [], aiResult }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [showSteps, setShowSteps] = useState(false);
  const [routeVisible, setRouteVisible] = useState(true);
  const [hudMinimized, setHudMinimized] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Projected screen coordinates state for 60FPS overlay rendering
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

  // 1. Detect if critical threat is active
  const criticalAlerts = alerts.filter(
    a => (a.severity?.toLowerCase() === 'critical' || a.title?.toLowerCase().includes('critical')) && !a.acknowledged
  );
  const criticalEvents = events.filter(
    e => e.risk_level?.toUpperCase() === 'CRITICAL' && e.status !== 'resolved'
  );
  const isAiCritical = aiResult?.risk?.level?.toUpperCase() === 'CRITICAL';
  const hasCriticalThreat = criticalAlerts.length > 0 || criticalEvents.length > 0 || isAiCritical || alerts.length > 0;
  const threatenedNodeId = criticalAlerts[0]?.node_id || criticalEvents[0]?.node_id || aiResult?.node_id || 'NODE-01';

  // Sync projected 2D coordinates from 3D map geo coordinates
  const updateProjectedPositions = useCallback(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    try {
      // Origin projection
      const originPoint = currentMap.project([DEPT_APPLIED_ELECTRONICS_LON, DEPT_APPLIED_ELECTRONICS_LAT]);

      // Routes projection
      const routes = EVACUATION_ROUTES.map(route => {
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

      // Nodes projection
      const nodeItems = (nodes.length > 0 ? nodes : [{ node_id: 'NODE-01', name: 'Sensor Node 01', status: 'online' } as Node]).map(n => {
        const lon = n.location?.longitude ?? DEPT_APPLIED_ELECTRONICS_LON;
        const lat = n.location?.latitude ?? DEPT_APPLIED_ELECTRONICS_LAT;
        const point = currentMap.project([lon, lat]);
        const isCritical = n.node_id === threatenedNodeId && hasCriticalThreat;
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
        routes,
        nodes: nodeItems
      });
    } catch (e) {
      console.error("Error updating projected positions:", e);
    }
  }, [nodes, threatenedNodeId, hasCriticalThreat]);

  // Center camera bounds covering the evacuation area
  const fitEvacuationBounds = useCallback(() => {
    if (!map.current) return;
    try {
      const bounds = new LngLatBounds();
      bounds.extend([DEPT_APPLIED_ELECTRONICS_LON, DEPT_APPLIED_ELECTRONICS_LAT]);
      EVACUATION_ROUTES.forEach(r => {
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
  }, []);

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
      center: [76.9048, 8.5460],
      zoom: 15.6
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

  // Auto-focus escape path on load
  useEffect(() => {
    if (mapLoaded && hasCriticalThreat && routeVisible) {
      fitEvacuationBounds();
    }
  }, [mapLoaded, hasCriticalThreat, routeVisible, fitEvacuationBounds]);

  const activeRoute = EVACUATION_ROUTES.find(r => r.id === selectedRouteId) || EVACUATION_ROUTES[0];

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-gray-950" />

      {/* High-Precision Interactive SVG Evacuation Overlay */}
      {mapLoaded && projectedData && hasCriticalThreat && routeVisible && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            {/* Neon Glow Filters */}
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

          {/* 1. Hazard Exclusion Radius (200m) */}
          <circle
            cx={projectedData.origin.x}
            cy={projectedData.origin.y}
            r="80"
            fill="rgba(239, 68, 68, 0.22)"
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

          {/* 2. Render All Evacuation Paths */}
          {projectedData.routes.map(r => {
            const isVisible = selectedRouteId === 'all' || selectedRouteId === r.id;
            if (!isVisible) return null;

            return (
              <g key={r.id}>
                {/* Safe Haven Assembly Perimeter */}
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
          {/* A. Hazard Epicenter Badge (Dept of Applied Electronics) */}
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
              <span>HAZARD EPICENTER: DEPT OF APPLIED ELECTRONICS</span>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 mx-auto -mt-[1px]" />

            {activeTooltip === 'origin' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-red-500 rounded-lg p-2.5 shadow-2xl text-xs text-white z-50">
                <div className="font-bold text-red-400 border-b border-gray-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Dept of Applied Electronics (CET)</span>
                </div>
                <p className="text-[11px] text-red-200 mb-1">Critical fire hazard detected. Immediate evacuation required!</p>
                <div className="text-[10px] text-gray-400">Exclusion: 200m Perimeter • Follow Routes 1, 2, or 3</div>
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
                    <p className="text-[11px] text-gray-300 mb-1.5">{EVACUATION_ROUTES.find(x => x.id === r.id)?.description}</p>
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
                {EVACUATION_ROUTES.map(r => (
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
                  <span>Hazard Location:</span>
                  <span className="font-bold text-red-300 font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-500" />
                    Dept of Applied Electronics
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Safe Destination:</span>
                  <span className="font-bold flex items-center gap-1" style={{ color: selectedRouteId === 'all' ? '#4ade80' : activeRoute.color }}>
                    <Shield className="w-3 h-3" />
                    {selectedRouteId === 'all' ? '3 Safe Havens Available' : activeRoute.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Distance / ETA:</span>
                  <span className="font-mono text-gray-200">
                    {selectedRouteId === 'all' ? '430m – 540m • 3.5 – 4.5 mins' : `${activeRoute.distance} • ~${activeRoute.eta}`}
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
          <span>Dept of Applied Electronics (Hazard Epicenter)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-green-400 rounded-full"></div>
          <span>Route 1: CET Main Ground (540m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-cyan-400 rounded-full"></div>
          <span>Route 2: Kulathoor West Gate (430m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-amber-400 rounded-full"></div>
          <span>Route 3: Sreekaryam East Gate (470m)</span>
        </div>
      </div>
    </div>
  );
}
