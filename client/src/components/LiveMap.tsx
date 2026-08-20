import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Popup, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Node, Event, Alert, CloudAIResult } from '../types';
import { ShieldAlert, ShieldCheck, Compass } from 'lucide-react';

interface LiveMapProps {
  nodes: Node[];
  events: Event[];
  alerts?: Alert[];
  aiResult?: CloudAIResult | null;
}

// Generate circular GeoJSON polygon around a point
function createGeoJSONCircle(center: [number, number], radiusInKm = 0.35, points = 64) {
  const [longitude, latitude] = center;
  const ret: [number, number][] = [];
  const distanceX = radiusInKm / (111.320 * Math.cos((latitude * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([longitude + x, latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ret]
    },
    properties: {}
  };
}

export default function LiveMap({ nodes, events, alerts = [], aiResult }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<{ [key: string]: Marker }>({});
  const safeMarker = useRef<Marker | null>(null);
  const [isCriticalRisk, setIsCriticalRisk] = useState(false);

  // Check for critical risk
  const isCritical = 
    aiResult?.risk.level === 'CRITICAL' ||
    events.some(e => e.risk_level === 'CRITICAL' && e.status !== 'resolved') ||
    alerts.some(a => a.severity === 'critical' && !a.acknowledged);

  useEffect(() => {
    setIsCriticalRisk(isCritical);
  }, [isCritical]);

  useEffect(() => {
    if (map.current) return;

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

    map.current = new Map({
      container: mapContainer.current!,
      style: mapStyle as any,
      center: [76.90524, 8.54416], // Sreekaryam - Kulathoor Rd, Trivandrum
      zoom: 15
    });

    map.current.addControl(new NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Setup Danger Zone and Evacuation Route Sources
      if (!map.current) return;

      // Hazard Zone Circle Source
      map.current.addSource('danger-zone-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Hazard Fill Layer
      map.current.addLayer({
        id: 'danger-zone-fill',
        type: 'fill',
        source: 'danger-zone-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.25
        }
      });

      // Hazard Outline Layer
      map.current.addLayer({
        id: 'danger-zone-outline',
        type: 'line',
        source: 'danger-zone-source',
        paint: {
          'line-color': '#dc2626',
          'line-width': 2.5,
          'line-dasharray': [2, 2]
        }
      });

      // Evacuation Route Line Source
      map.current.addSource('evacuation-route-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Evacuation Outer Glow
      map.current.addLayer({
        id: 'evacuation-route-glow',
        type: 'line',
        source: 'evacuation-route-source',
        paint: {
          'line-color': '#22c55e',
          'line-width': 8,
          'line-opacity': 0.45,
          'line-blur': 3
        }
      });

      // Evacuation Main Core Line
      map.current.addLayer({
        id: 'evacuation-route-line',
        type: 'line',
        source: 'evacuation-route-source',
        paint: {
          'line-color': '#4ade80',
          'line-width': 4,
          'line-dasharray': [2, 1]
        }
      });
    });
  }, []);

  // Update Hazard Zone and Evacuation Route based on Critical Risk
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const dangerSource = map.current.getSource('danger-zone-source') as any;
    const routeSource = map.current.getSource('evacuation-route-source') as any;

    if (!dangerSource || !routeSource) return;

    if (isCriticalRisk) {
      // Find danger node or default to Sreekaryam coordinates
      const dangerNode = nodes.find(n => n.node_id === 'NODE-01' && n.location) || nodes[0];
      const centerLon = dangerNode?.location?.longitude ?? 76.90524;
      const centerLat = dangerNode?.location?.latitude ?? 8.54416;

      // 1. Set Danger Zone Polygon (Red Circle ~350m radius)
      const circleFeature = createGeoJSONCircle([centerLon, centerLat], 0.35);
      dangerSource.setData({
        type: 'FeatureCollection',
        features: [circleFeature]
      });

      // 2. Set Smart Evacuation Path (Escape Route towards Safe Haven at bypass)
      const escapePathCoords: [number, number][] = [
        [centerLon, centerLat],
        [centerLon - 0.0018, centerLat + 0.0022],
        [centerLon - 0.0042, centerLat + 0.0045],
        [centerLon - 0.0070, centerLat + 0.0070],
        [centerLon - 0.0095, centerLat + 0.0092] // Safe Haven Assembly Destination
      ];

      routeSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: escapePathCoords
            },
            properties: {}
          }
        ]
      });

      // 3. Safe Haven Destination Marker
      const endPoint = escapePathCoords[escapePathCoords.length - 1];
      if (!safeMarker.current) {
        const safeEl = document.createElement('div');
        safeEl.className = 'flex items-center gap-1.5 bg-green-950 text-green-300 border-2 border-green-500 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-2xl animate-bounce';
        safeEl.innerHTML = `<span>🛡️ SAFE HAVEN</span>`;

        safeMarker.current = new Marker(safeEl)
          .setLngLat(endPoint)
          .addTo(map.current);
      } else {
        safeMarker.current.setLngLat(endPoint);
      }

    } else {
      // Clear Danger Zone & Evacuation Route
      dangerSource.setData({ type: 'FeatureCollection', features: [] });
      routeSource.setData({ type: 'FeatureCollection', features: [] });

      if (safeMarker.current) {
        safeMarker.current.remove();
        safeMarker.current = null;
      }
    }
  }, [isCriticalRisk, nodes]);

  // Update Node Markers
  useEffect(() => {
    if (!map.current) return;

    nodes.forEach(node => {
      if (!node.location) return;

      const { longitude, latitude } = node.location;
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full border-2 border-gray-900 shadow-md transition-colors';
      
      const nodeEvents = events.filter(e => e.node_id === node.node_id && e.status !== 'resolved');
      const isNodeCritical = nodeEvents.some(e => e.risk_level === 'CRITICAL') || isCriticalRisk;
      const isHigh = nodeEvents.some(e => e.risk_level === 'HIGH');
      const isWarning = nodeEvents.some(e => e.risk_level === 'MEDIUM');
      
      let statusHtml = `Status: <strong>${node.status.toUpperCase()}</strong>`;
      
      if (node.status === 'offline') {
        el.classList.add('bg-gray-500');
      } else if (isNodeCritical) {
        el.classList.add('bg-red-500', 'animate-pulse');
        statusHtml += `<br><span class="text-red-600 font-bold">CRITICAL HAZARD ZONE</span>`;
      } else if (isHigh) {
        el.classList.add('bg-orange-500');
        statusHtml += `<br><span class="text-orange-500 font-bold">HIGH RISK</span>`;
      } else if (isWarning) {
        el.classList.add('bg-yellow-500');
        statusHtml += `<br><span class="text-yellow-600 font-bold">WARNING</span>`;
      } else {
        el.classList.add('bg-green-500'); 
      }

      const popup = new Popup({ offset: 25 }).setHTML(`
        <div class="text-gray-900 font-sans p-1">
          <h3 class="font-bold border-b pb-1 mb-1">${node.name}</h3>
          <p class="text-sm">${statusHtml}</p>
          ${node.battery ? `<p class="text-sm">Battery: ${node.battery}%</p>` : ''}
          <p class="text-xs text-gray-500 mt-2">ID: ${node.node_id}</p>
        </div>
      `);

      if (markers.current[node.node_id]) {
        markers.current[node.node_id].setLngLat([longitude, latitude]);
        const markerEl = markers.current[node.node_id].getElement();
        markerEl.className = el.className;
        markers.current[node.node_id].setPopup(popup);
      } else {
        markers.current[node.node_id] = new Marker(el)
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

  }, [nodes, isCriticalRisk, events]);

  return (
    <div className="relative w-full h-full">
      {/* Floating Evacuation HUD Indicator */}
      {isCriticalRisk && (
        <div className="absolute top-3 left-3 z-10 bg-gray-950/90 border border-red-500/80 text-white px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
          <div className="p-1.5 bg-red-950/80 rounded-lg border border-red-700 text-red-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-red-400 uppercase bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                CRITICAL DISASTER ZONE
              </span>
              <span className="text-xs text-gray-400 font-mono">Radius ~350m</span>
            </div>
            <div className="text-xs font-bold text-green-400 flex items-center gap-1 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-green-400" />
              <span>Smart Evacuation Corridor: Follow Green Route to Safe Haven</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
