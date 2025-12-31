import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

// Fix for default marker icons in React-Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Define types for props
interface MapComponentProps {
  orders?: any[];
  riders?: any[];
  route?: any;
  center?: [number, number];
  zoom?: number;
  showTraffic?: boolean;
  onMapClick?: (latlng: [number, number]) => void;
}

// Component to update map view when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onClick }: { onClick?: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function MapComponent({
  orders = [],
  riders = [],
  route,
  center = [20.5937, 78.9629], // India Center
  zoom = 5,
  showTraffic = false,
  onMapClick
}: MapComponentProps) {

  // Fix marker icons once on mount
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconUrl,
      shadowUrl: iconShadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    // safe assign
    // @ts-ignore
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  // Memoize route positions calculation to avoid re-calc on every render
  const routePositions: [number, number][] = useMemo(() => {
    if (!route) return [];
    
    try {
      // Case 1: GeoJSON object (GraphHopper with points_encoded=false)
      // Structure: { type: "LineString", coordinates: [[lng, lat], ...] }
      if (route.points && typeof route.points === 'object' && Array.isArray(route.points.coordinates)) {
        return route.points.coordinates.map((c: number[]) => [c[1], c[0]]); // Convert [lng, lat] to [lat, lng]
      }

      // Case 2: Array of points directly
      if (Array.isArray(route.points) && route.points.length > 0) {
        const firstPoint = route.points[0];
        if (Array.isArray(firstPoint)) {
             return route.points as [number, number][];
        }
      }

      // Case 3: Encoded Polyline string
      if (typeof route.points === 'string') {
        return decodePolyline(route.points);
      }

    } catch (e) {
      console.error("Error parsing route points:", e);
    }
    return [];
  }, [route]);

  // Helper to decode polyline (fallback)
  function decodePolyline(encoded: string): [number, number][] {
    if (!encoded) return [];
    const poly: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }

  // Normalize orders/riders into safe coords
  const normalizedOrders = (orders || []).map((o: any) => {
    const lat = (o.lat ?? o.latitude ?? o.location?.lat ?? o.coords?.lat);
    const lng = (o.lng ?? o.longitude ?? o.location?.lng ?? o.coords?.lng);
    if (lat == null || lng == null) return null;
    return { ...o, _pos: [Number(lat), Number(lng)] as [number, number] };
  }).filter(Boolean) as any[];

  const normalizedRiders = (riders || []).map((r: any) => {
    const lat = (r.current_lat ?? r.lat ?? r.latitude ?? r.location?.lat);
    const lng = (r.current_lng ?? r.lng ?? r.longitude ?? r.location?.lng);
    if (lat == null || lng == null) return null;
    return { ...r, _pos: [Number(lat), Number(lng)] as [number, number] };
  }).filter(Boolean) as any[];

  return (
    <div className="h-full w-full min-h-[300px]">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showTraffic && (
          <TileLayer
            url="https://mt0.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
          />
        )}

        {/* Render Orders */}
        {normalizedOrders.map((order, idx) => (
          <Marker key={order.id ?? `order-${idx}`} position={order._pos}>
            <Popup>
              <div>
                <p className="font-bold">Order #{order.id ?? '—'}</p>
                {order.customer_name && <p>{order.customer_name}</p>}
                {order.status && <p>{order.status}</p>}
                {order.address && <p className="text-xs text-gray-500">{order.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Riders */}
        {normalizedRiders.map((rider, idx) => (
          <Marker key={rider.id ?? `rider-${idx}`} position={rider._pos} opacity={0.85}>
            <Popup>
              <div>
                <p className="font-bold">Rider: {rider.name ?? rider.id}</p>
                <p>Status: {rider.status ?? '—'}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Route */}
        {routePositions.length > 0 && (
          <Polyline positions={routePositions} pathOptions={{ color: 'blue', weight: 5 }} />
        )}
        <MapEvents onClick={onMapClick} />
      </MapContainer>
    </div>
  );
}