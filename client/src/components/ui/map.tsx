import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, Compass, Locate } from "lucide-react";
import { cn } from "@/lib/utils";

// Configure Web Worker from unpkg default or local if self-hosted
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl-worker.mjs");
}

export const CARTO_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

interface MapContextValue {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

const MapContext = React.createContext<MapContextValue>({
  map: null,
  isLoaded: false,
});

export function useMap() {
  const context = React.useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a <Map /> component");
  }
  return context;
}

export interface MapProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onLoad"> {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  pitch?: number;
  bounds?: maplibregl.LngLatBoundsLike;
  fitBoundsOptions?: maplibregl.FitBoundsOptions;
  bearing?: number;
  styleUrl?: string;
  lightStyleUrl?: string;
  darkStyleUrl?: string;
  interactive?: boolean;
  onLoad?: (map: maplibregl.Map) => void;
}

export function Map({
  center = [-74.006, 40.7128],
  zoom = 11,
  pitch = 0,
  bounds,
  fitBoundsOptions,
  bearing = 0,
  styleUrl,
  lightStyleUrl = CARTO_STYLES.light,
  darkStyleUrl = CARTO_STYLES.dark,
  interactive = true,
  onLoad,
  className,
  children,
  ...props
}: MapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [mapInstance, setMapInstance] = React.useState<maplibregl.Map | null>(null);

  // Theme detection
  const getStyleForTheme = React.useCallback(() => {
    if (styleUrl) return styleUrl;
    if (typeof window === "undefined") return lightStyleUrl;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches ||
      document.documentElement.classList.contains("dark");
    return isDark ? darkStyleUrl : lightStyleUrl;
  }, [styleUrl, lightStyleUrl, darkStyleUrl]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyle = getStyleForTheme();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: center,
      zoom: zoom,
      bounds,
      pitch: pitch,
      bearing: bearing,
      interactive: interactive,
      attributionControl: false,
    });

    // Custom attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© CARTO, © OpenStreetMap contributors",
      }),
      "bottom-right"
    );

    map.on("load", () => {
      setIsLoaded(true);
      if (onLoad) onLoad(map);
    });

    mapRef.current = map;
    setMapInstance(map);

    // Dark/Light auto-switch listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => {
      if (!styleUrl && mapRef.current) {
        const nextStyle = getStyleForTheme();
        mapRef.current.setStyle(nextStyle);
      }
    };
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync center/zoom updates if props change
  React.useEffect(() => {
    if (mapRef.current && isLoaded) {
      if (bounds) {
        mapRef.current.fitBounds(bounds, fitBoundsOptions);
        return;
      }
      mapRef.current.flyTo({ center, zoom, duration: 1000 });
    }
  }, [bounds, fitBoundsOptions, center, zoom, isLoaded]);

  return (
    <MapContext.Provider value={{ map: mapInstance, isLoaded }}>
      <div
        ref={containerRef}
        className={cn("relative w-full h-full min-h-[300px] overflow-hidden", className)}
        {...props}
      >
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  );
}

export interface MapControlsProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  className?: string;
}

export function MapControls({
  position = "top-right",
  showZoom = true,
  showCompass = true,
  showLocate = true,
  className,
}: MapControlsProps) {
  const { map, isLoaded } = useMap();

  const positionClasses = {
    "top-left": "top-3 left-3 flex-col",
    "top-right": "top-3 right-3 flex-col",
    "bottom-left": "bottom-3 left-3 flex-col-reverse",
    "bottom-right": "bottom-3 right-3 flex-col-reverse",
  };

  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  const handleResetNorth = () => {
    map?.resetNorthPitch();
  };

  const handleLocate = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 14,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  };

  if (!isLoaded || !map) return null;

  return (
    <div
      className={cn(
        "absolute z-10 flex gap-1.5 p-1 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-md",
        positionClasses[position],
        className
      )}
    >
      {showZoom && (
        <>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </>
      )}
      {showCompass && (
        <button
          type="button"
          onClick={handleResetNorth}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
          title="Reset Bearing"
        >
          <Compass className="w-4 h-4" />
        </button>
      )}
      {showLocate && (
        <button
          type="button"
          onClick={handleLocate}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
          title="My Location"
        >
          <Locate className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function MapMarker({ longitude, latitude, children, onClick }: MapMarkerProps) {
  const { map, isLoaded } = useMap();
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!map || !isLoaded || !elementRef.current) return;

    const marker = new maplibregl.Marker({ element: elementRef.current })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, isLoaded, longitude, latitude]);

  return (
    <div
      ref={elementRef}
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-110"
    >
      {children || (
        <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
      )}
    </div>
  );
}
