import { useEffect, useRef } from 'react';
import { Map, NavigationControl, Popup, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Node, Event } from '../types';

interface LiveMapProps {
  nodes: Node[];
  events: Event[];
}

export default function LiveMap({ nodes, events }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<{ [key: string]: Marker }>({});

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
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
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
      center: [76.9366, 8.5241], // Default fallback center
      zoom: 12
    });

    map.current.addControl(new NavigationControl(), 'top-right');

    // Attempt to get user's current geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 14,
              essential: true
            });
          }
        },
        (error) => {
          console.warn('Geolocation failed or permission denied:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;

    nodes.forEach(node => {
      if (!node.location) return;

      const { longitude, latitude } = node.location;
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full border-2 border-gray-900 shadow-md transition-colors';
      
      const nodeEvents = events.filter(e => e.node_id === node.node_id && e.status !== 'resolved');
      const isCritical = nodeEvents.some(e => e.risk_level === 'CRITICAL');
      const isHigh = nodeEvents.some(e => e.risk_level === 'HIGH');
      const isWarning = nodeEvents.some(e => e.risk_level === 'MEDIUM');
      
      let statusHtml = `Status: <strong>${node.status.toUpperCase()}</strong>`;
      
      if (node.status === 'offline') {
        el.classList.add('bg-gray-500');
      } else if (isCritical) {
        el.classList.add('bg-red-500');
        el.classList.add('animate-pulse');
        statusHtml += `<br><span class="text-red-600 font-bold">CRITICAL RISK</span>`;
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
        // Update DOM element color
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

  }, [nodes]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
