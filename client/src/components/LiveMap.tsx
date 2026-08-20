import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Node } from '../types';

interface LiveMapProps {
  nodes: Node[];
}

export default function LiveMap({ nodes }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [76.9366, 8.5241], // Default center (Trivandrum)
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Update markers
    nodes.forEach(node => {
      if (!node.location) return;

      const { longitude, latitude } = node.location;
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full border-2 border-gray-900 shadow-md transition-colors';
      
      if (node.status === 'offline') {
        el.classList.add('bg-gray-500');
      } else {
        // Here we could base color on node's risk, but we only have general status for now
        el.classList.add('bg-green-500'); 
      }

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="text-gray-900 font-sans p-1">
          <h3 class="font-bold border-b pb-1 mb-1">${node.name}</h3>
          <p class="text-sm">Status: <strong>${node.status.toUpperCase()}</strong></p>
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
        markers.current[node.node_id] = new maplibregl.Marker(el)
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

  }, [nodes]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
