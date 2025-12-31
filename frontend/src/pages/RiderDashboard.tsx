import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Package,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Route,
  Locate,
  RefreshCw,
  XCircle,
  Timer,
  Truck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { MapComponent } from '../components/MapComponent';
import { getRiderOrders, optimizeRoute, updateRiderLocation, updateOrderStatus, reportTraffic, cancelOrder, pickOrder, pickAllOrders } from '../services/api';

interface RiderDashboardProps {
  onBack: () => void;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA based on distance with traffic considerations
// Base speed: 25 km/h in normal conditions, 15 km/h in heavy traffic
function calculateETA(distanceKm: number, hasTraffic: boolean = false): { minutes: number; timeWindow: string } {
  const avgSpeedKmH = hasTraffic ? 15 : 25; // km/h considering urban traffic
  const estimatedMinutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);
  
  // Add buffer time for delivery (finding address, parking, etc.)
  const bufferMinutes = 5;
  const totalMinutes = estimatedMinutes + bufferMinutes;
  
  // Create time window (±5 min for short trips, ±10 min for longer)
  const variance = totalMinutes > 30 ? 10 : 5;
  const minTime = Math.max(totalMinutes - variance, 1);
  const maxTime = totalMinutes + variance;
  
  const timeWindow = `${minTime}-${maxTime} min`;
  
  return { minutes: totalMinutes, timeWindow };
}

export function RiderDashboard({ onBack }: RiderDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [avoidTraffic, setAvoidTraffic] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveringOrderId, setDeliveringOrderId] = useState<number | null>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const lastLocationUpdateRef = useRef(0);

  // Helper to refresh data
  const refreshData = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const ordersData = await getRiderOrders(user.user_id);
      console.log("RiderDashboard: Fetched orders:", ordersData);
      setOrders(ordersData);
      
      if (ordersData.length > 0) {
          try {
              const routeData = await optimizeRoute(user.user_id, avoidTraffic);
              setRoute(routeData);
          } catch (e) {
              console.log("No route available yet", e);
              setRoute(null);
          }
      } else {
        setRoute(null);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate distances from current location to each order
  const ordersWithDistance = useMemo(() => {
    if (!currentLocation) return orders.map(o => ({ ...o, distance: null }));
    
    return orders.map(order => {
      const distance = calculateDistance(
        currentLocation[0], currentLocation[1],
        order.lat, order.lng
      );
      return { ...order, distance };
    });
  }, [orders, currentLocation]);

  // Calculate total route distance
  const totalRouteDistance = useMemo(() => {
    if (route?.distance) {
      return (route.distance / 1000).toFixed(1); // Convert meters to km
    }
    // Fallback: sum distances to all in-transit orders
    const inTransit = ordersWithDistance.filter(o => o.status === 'in-transit');
    if (inTransit.length === 0 || !currentLocation) return null;
    return inTransit.reduce((sum, o) => sum + (o.distance || 0), 0).toFixed(1);
  }, [route, ordersWithDistance, currentLocation]);

  useEffect(() => {
    if (user && isOnline) {
        refreshData();
        // Poll for updates every 5 seconds
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }
  }, [user, isOnline, avoidTraffic]); // Re-fetch when avoidTraffic changes

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('RiderDashboard: Loaded user:', parsedUser);
        setUser(parsedUser);
      } else {
        console.warn('RiderDashboard: No user found in localStorage');
        setError('No user session found. Please log in again.');
      }
    } catch (err) {
      console.error('RiderDashboard: Error loading user:', err);
      setError('Error loading user session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Removed the old useEffect that was doing initial fetch to avoid duplication with the polling one above

  useEffect(() => {
    if (!user || !isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        
        const now = Date.now();
        // throttle updates to once every 5s
        if (now - lastLocationUpdateRef.current > 5000) {
          lastLocationUpdateRef.current = now;
          updateRiderLocation(user.user_id, latitude, longitude).catch(console.error);
        }
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, isOnline]);

  const handleReportTraffic = async () => {
    if (!currentLocation) {
        alert("Waiting for location...");
        return;
    }
    try {
        await reportTraffic(currentLocation[0], currentLocation[1]);
        alert("Traffic reported at your location. Route will be re-optimized.");
        setAvoidTraffic(true); // Enable avoidance
        refreshData(); // Trigger re-optimization
    } catch (e) {
        console.error("Error reporting traffic:", e);
        alert("Failed to report traffic");
    }
  };

  const handleNavigate = () => {
    setShowRoute(true);
  };

  const handleShowOrderOnMap = (order: any) => {
    // Center map on the order location
    if (order.lat && order.lng) {
      setCurrentLocation([order.lat, order.lng]);
      setShowRoute(true);
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    if (!window.confirm("Mark this order as delivered?")) return;
    setDeliveringOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'delivered');
      await refreshData();
    } catch (err) {
      console.error("Error delivering order:", err);
      alert("Failed to mark as delivered");
    } finally {
      setDeliveringOrderId(null);
    }
  };

  const handlePickOrder = async (orderId: number) => {
    try {
      await pickOrder(orderId);
      await refreshData();
    } catch (e) {
      console.error("Error picking order:", e);
      alert("Failed to pick order");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder(orderId);
      await refreshData();
    } catch (e) {
      console.error("Error cancelling order:", e);
      alert("Failed to cancel order");
    }
  };

  const handlePickAll = async () => {
    if (!user) return;
    try {
      await pickAllOrders(user.user_id);
      await refreshData();
    } catch (e) {
      console.error("Error picking all orders:", e);
      alert("Failed to pick all orders");
    }
  };

  // Sort orders based on route if available, otherwise use default order
  const assignedOrders = ordersWithDistance.filter(o => o.status === 'assigned');
  const inTransitOrders = ordersWithDistance.filter(o => o.status === 'in-transit' || o.status === 'picked-up');
  
  // All active orders sorted by distance (nearest first)
  const allActiveOrders = [...inTransitOrders, ...assignedOrders].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  // Add display index to sorted orders for consistent numbering on map
  const ordersForMap = allActiveOrders.map((order, index) => ({
    ...order,
    displayIndex: index + 1
  }));

  // Get status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading Rider Dashboard...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <div className="text-white mb-6">{error}</div>
          <Button onClick={onBack} className="bg-emerald-500 hover:bg-emerald-600">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          orders={[...ordersForMap, ...availableOrders.map(o => ({...o, isAvailable: true}))]} 
          route={showRoute ? route : null} 
          riders={user ? [{
              id: user.user_id, 
              current_lat: currentLocation ? currentLocation[0] : (user.current_lat || 12.9716), 
              current_lng: currentLocation ? currentLocation[1] : (user.current_lng || 77.5946), 
              name: user.name, 
              status: "busy",
              isCurrentRider: true
          }] : []} 
          center={currentLocation || undefined}
          zoom={15}
          showTraffic={showTraffic}
          onMapClick={(latlng) => {
             const clickedOrder = availableOrders.find(o => 
                Math.abs(o.lat - latlng[0]) < 0.001 && Math.abs(o.lng - latlng[1]) < 0.001
             );
             if (clickedOrder) {
                 if (window.confirm(`Pick up order for ${clickedOrder.customer_name}?`)) {
                     handlePickOrder(clickedOrder.id);
                 }
             }
          }}
        />
      </div>

      {/* Left Sidebar - Responsive Design */}
      <div className="absolute top-0 left-0 bottom-0 w-full sm:w-[380px] z-20 bg-gradient-to-b from-slate-900/98 to-slate-950/98 border-r border-slate-700/50 flex flex-col backdrop-blur-xl shadow-2xl">
        
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 w-9"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-white font-bold text-lg">Deliveries</h1>
                <p className="text-slate-500 text-xs">{user?.name || 'Rider'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshData}
                disabled={refreshing}
                className="text-slate-400 hover:text-white h-9 w-9"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Route Stats Bar */}
        {allActiveOrders.length > 0 && (
          <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold">{allActiveOrders.length}</div>
                    <div className="text-slate-500 text-[10px]">Orders</div>
                  </div>
                </div>
                {totalRouteDistance && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Route className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold">{totalRouteDistance} <span className="text-xs font-normal text-slate-400">km</span></div>
                      <div className="text-slate-500 text-[10px]">Total Route</div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigate}
                className={`h-8 px-3 text-xs ${showRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}
              >
                <Navigation className="w-3 h-3 mr-1" />
                {showRoute ? 'Route On' : 'Show Route'}
              </Button>
            </div>
          </div>
        )}

        {/* Pick All Button */}
        {assignedOrders.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-800/50">
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-10 transition-all hover:scale-[1.01]"
              onClick={handlePickAll}
            >
              <Truck className="w-4 h-4 mr-2" />
              Pick Up All {assignedOrders.length} Orders
            </Button>
          </div>
        )}

        {/* Orders List */}
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-4 space-y-3">
            {allActiveOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">No Active Orders</h3>
                <p className="text-slate-500 text-sm">Wait for new assignments...</p>
              </div>
            ) : (
              allActiveOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={`bg-slate-800/40 rounded-xl border transition-all hover:bg-slate-800/60 ${
                    order.status === 'in-transit' ? 'border-purple-500/30' : 'border-slate-700/50'
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          order.status === 'in-transit' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-slate-400 text-xs font-mono">#{order.id}</span>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 border ${getStatusColor(order.status)}`}>
                        {order.status === 'in-transit' ? 'In Transit' : order.status}
                      </Badge>
                    </div>

                    <h3 className="text-white font-semibold mb-1">{order.customer_name}</h3>
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400 text-sm leading-tight">{order.delivery_address}</span>
                    </div>

                    {/* Distance and ETA Badge */}
                    {order.distance !== null && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg">
                          <Navigation className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 text-sm font-medium">{order.distance.toFixed(1)} km</span>
                          <span className="text-slate-500 text-xs">away</span>
                        </div>
                        {/* ETA Time Window */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <Timer className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 text-sm font-medium">
                            {calculateETA(order.distance, showTraffic).timeWindow}
                          </span>
                          {showTraffic && (
                            <span className="text-amber-500/70 text-[10px]">🚗</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="px-4 pb-4 pt-0 flex gap-2">
                    {order.status === 'assigned' ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-9"
                          onClick={() => handlePickOrder(order.id)}
                        >
                          <Package className="w-4 h-4 mr-1.5" />
                          Pick Up
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-3 text-slate-400 hover:text-white hover:bg-slate-700"
                          onClick={() => handleShowOrderOnMap(order)}
                          title="Show on map"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-9 shadow-lg shadow-emerald-500/20"
                          onClick={() => handleDeliverOrder(order.id)}
                          disabled={deliveringOrderId === order.id}
                        >
                          {deliveringOrderId === order.id ? (
                            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          )}
                          Mark Delivered
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-3 text-slate-400 hover:text-white hover:bg-slate-700"
                          onClick={() => handleShowOrderOnMap(order)}
                          title="Show on map"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Bottom Location Status */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentLocation ? 'bg-emerald-500/20' : 'bg-slate-700'
              }`}>
                <Locate className={`w-4 h-4 ${currentLocation ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {currentLocation ? 'Location Active' : 'Locating...'}
                </div>
                <div className="text-slate-500 text-xs">
                  {currentLocation ? `${currentLocation[0].toFixed(4)}, ${currentLocation[1].toFixed(4)}` : 'Getting GPS signal'}
                </div>
              </div>
            </div>
            <Switch 
              checked={isOnline} 
              onCheckedChange={setIsOnline} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
