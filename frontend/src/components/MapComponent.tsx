import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

// Create custom rider icon using SVG
// REPLACE your existing createRiderIcon with this:
const createRiderIcon = (color = '#10b981') => { // Default to emerald
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="${color}" filter="url(#shadow)"/>
      <circle cx="32" cy="32" r="24" fill="${color === '#64748b' ? '#475569' : '#059669'}"/>
      <circle cx="32" cy="24" r="8" fill="white"/>
      <path d="M20 42 Q32 34 44 42 Q44 50 32 52 Q20 50 20 42" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'rider-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

// Create custom order icon
const createOrderIcon = (index: number, status: string) => {
  const bgColor = status === 'in-transit' ? '#8b5cf6' : status === 'assigned' ? '#3b82f6' : '#64748b';
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="32" height="40">
      <defs>
        <filter id="ordershadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M20 0 C30 0 38 8 38 18 C38 32 20 50 20 50 C20 50 2 32 2 18 C2 8 10 0 20 0" fill="${bgColor}" filter="url(#ordershadow)"/>
      <circle cx="20" cy="18" r="12" fill="white"/>
      <text x="20" y="23" text-anchor="middle" fill="${bgColor}" font-size="14" font-weight="bold" font-family="system-ui">${index}</text>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'order-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });
};

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
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    // safe assign
    // @ts-ignore
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  // Memoize route positions calculation to avoid re-calc on every render
  // Memoize route positions calculation to avoid re-calc on every render
  const routePositions: [number, number][] = useMemo(() => {
    if (!route) return [];
    
    // 1. Extract the actual points data from various possible structures
    let pointsData = route.points;
    
    // Handle GraphHopper structure where points are inside 'paths' array
    if (!pointsData && route.paths && Array.isArray(route.paths) && route.paths.length > 0) {
      pointsData = route.paths[0].points;
    }

    if (!pointsData) return [];

    try {
      // Case 1: GeoJSON object (GraphHopper with points_encoded=false)
      // Structure: { type: "LineString", coordinates: [[lng, lat], ...] }
      if (typeof pointsData === 'object' && Array.isArray(pointsData.coordinates)) {
        return pointsData.coordinates.map((c: number[]) => [c[1], c[0]]); // Convert [lng, lat] to [lat, lng]
      }

      // Case 2: Array of points directly
      if (Array.isArray(pointsData) && pointsData.length > 0) {
         return pointsData as [number, number][];
      }

      // Case 3: Encoded Polyline string
      if (typeof pointsData === 'string') {
        return decodePolyline(pointsData);
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

        {/* Render Orders with custom icons */}
        {normalizedOrders.map((order, idx) => (
          <Marker 
            key={order.id ?? `order-${idx}`} 
            position={order._pos}
            icon={createOrderIcon(order.displayIndex ?? (idx + 1), order.status)}
            eventHandlers={{
              click: () => {
                if (onMapClick) onMapClick(order._pos);
              }
            }}
            opacity={order.isAvailable ? 0.7 : 1.0}
          >
            <Popup>
              <div className="min-w-[150px]">
                <p className="font-bold text-base mb-1">Order #{order.id ?? '—'}</p>
                {order.isAvailable && <p className="text-green-600 font-bold text-sm mb-1">📦 Available to Pick!</p>}
                {order.customer_name && <p className="text-sm mb-1">👤 {order.customer_name}</p>}
                {order.status && (
                  <p className={`text-sm font-medium ${
                    order.status === 'in-transit' ? 'text-purple-600' : 
                    order.status === 'assigned' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    📍 {order.status}
                  </p>
                )}
                {order.delivery_address && <p className="text-xs text-gray-500 mt-1">{order.delivery_address}</p>}
                {order.distance !== undefined && order.distance !== null && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">🚗 {order.distance.toFixed(1)} km away</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Riders with custom icon */}
        {/* Find this block in your JSX */}
{normalizedRiders.map((rider, idx) => (
  <Marker 
    key={rider.id ?? `rider-${idx}`} 
    position={rider._pos}
    // REPLACE the icon line with this:
    icon={createRiderIcon(rider.isCurrentRider ? '#10b981' : '#64748b')} 
  >
            <Popup>
              <div className="min-w-[120px]">
                <p className="font-bold text-base mb-1">🏍️ {rider.name ?? `Rider ${rider.id}`}</p>
                <p className={`text-sm font-medium ${
                  rider.status === 'busy' ? 'text-amber-600' : 
                  rider.status === 'available' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {rider.status === 'busy' ? '🔴 On Delivery' : 
                   rider.status === 'available' ? '🟢 Available' : '⚫ ' + (rider.status ?? 'Unknown')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Route with gradient-like effect */}
        {routePositions.length > 0 && (
          <>
            {/* Shadow/glow layer */}
            <Polyline 
              positions={routePositions} 
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 8, 
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round'
              }} 
            />
            {/* Main route line */}
            <Polyline 
              positions={routePositions} 
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 4, 
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: undefined
              }} 
            />
          </>
        )}
        <MapEvents onClick={onMapClick} />
      </MapContainer>
    </div>
  );
}