import { useState, useEffect } from 'react';
import { 
  Phone, 
  Navigation, 
  MapPin, 
  DollarSign, 
  Package,
  User,
  ChevronRight,
  Clock,
  ArrowLeft,
  Star,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { MapComponent } from '../components/MapComponent';
import { getRiderOrders, optimizeRoute, updateRiderLocation, updateOrderStatus, reportTraffic } from '../services/api';

interface RiderDashboardProps {
  onBack: () => void;
}

export function RiderDashboard({ onBack }: RiderDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [avoidTraffic, setAvoidTraffic] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Helper to refresh data
  const refreshData = async () => {
    if (!user) return;
    try {
      const ordersData = await getRiderOrders(user.user_id);
      setOrders(ordersData);
      if (ordersData.length > 0) {
          try {
              const routeData = await optimizeRoute(user.user_id, avoidTraffic);
              setRoute(routeData);
          } catch (e) {
              console.log("No route available yet", e);
          }
      } else {
        setRoute(null);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  useEffect(() => {
    if (user && orders.length > 0) {
        refreshData();
    }
  }, [avoidTraffic]); // Re-optimize when avoidTraffic changes

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

  useEffect(() => {
    if (!user) {
      console.log('RiderDashboard: No user, skipping data fetch');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('RiderDashboard: Fetching orders for rider:', user.user_id);
        const ordersData = await getRiderOrders(user.user_id);
        console.log('RiderDashboard: Fetched orders:', ordersData);
        setOrders(ordersData);
        setError(null);
        
        // Try to get optimized route if there are orders
        if (ordersData.length > 0) {
            try {
                const routeData = await optimizeRoute(user.user_id, avoidTraffic);
                console.log('RiderDashboard: Fetched route:', routeData);
                setRoute(routeData);
            } catch (e) {
                console.log("RiderDashboard: No route available yet", e);
            }
        }
      } catch (error: any) {
        console.error("RiderDashboard: Error fetching rider data:", error);
        if (error.response?.status !== 401) {
          setError(`Failed to load data: ${error.message}`);
        }
      }
    };

    if (isOnline) {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }
  }, [isOnline, user, avoidTraffic]);


  useEffect(() => {
    if (!user || !isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        // Update location every time it changes (throttling might be needed in production)
        updateRiderLocation(user.user_id, latitude, longitude).catch(console.error);
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
    if (!activeOrder) return;
    // Open Google Maps for navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeOrder.lat},${activeOrder.lng}`;
    window.open(url, '_blank');
  };

  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleSwipeMove = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !activeOrder) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const progress = Math.min(Math.max((clientX - container.left) / container.width, 0), 1);
    setSwipeProgress(progress);
    
    if (progress > 0.9) {
      setSwipeProgress(0);
      setIsDragging(false);
      
      // Determine next status
      let nextStatus = '';
      let message = '';
      
      if (activeOrder.status === 'assigned') {
        nextStatus = 'picked-up';
        message = 'Order Picked Up!';
      } else if (activeOrder.status === 'picked-up' || activeOrder.status === 'in-transit') {
        nextStatus = 'delivered';
        message = 'Order Delivered!';
      }

      if (nextStatus) {
        try {
          await updateOrderStatus(activeOrder.id, nextStatus);
          alert(message);
          await refreshData();
        } catch (err) {
          console.error("Error updating status:", err);
          alert("Failed to update status");
        }
      }
    }
  };

  const handleSwipeEnd = () => {
    setIsDragging(false);
    if (swipeProgress < 0.9) {
      setSwipeProgress(0);
    }
  };

  const activeOrder = orders.find(o => o.status === 'assigned' || o.status === 'picked-up' || o.status === 'in-transit');
  const upcomingDeliveries = orders.filter(o => o.id !== activeOrder?.id && o.status !== 'delivered' && o.status !== 'cancelled');

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
          orders={orders} 
          route={route} 
          riders={user ? [{
              id: user.user_id, 
              current_lat: currentLocation ? currentLocation[0] : (user.current_lat || 12.9716), 
              current_lng: currentLocation ? currentLocation[1] : (user.current_lng || 77.5946), 
              name: user.name, 
              status: "busy"
          }] : []} 
          center={currentLocation || undefined}
          zoom={15}
          showTraffic={showTraffic}
        />
      </div>

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="bg-slate-900/50 text-white hover:bg-slate-900 pointer-events-auto backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <Card className="bg-slate-900/90 border-slate-700 p-3 pointer-events-auto backdrop-blur-sm space-y-3 min-w-[200px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 text-sm">Online Status</span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 text-sm">Show Traffic</span>
            <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 text-sm">Avoid Traffic</span>
            <Switch checked={avoidTraffic} onCheckedChange={setAvoidTraffic} />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={handleReportTraffic}
          >
            Report Traffic Here
          </Button>
        </Card>
      </div>

      {/* Bottom Panel - Active Order */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-md pointer-events-auto space-y-4">
           {activeOrder ? (
             <Card className="bg-slate-900/95 border-emerald-600/50 border-2 p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-blue-600 text-white border-0 px-3 py-1">
                    {activeOrder.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                        onClick={handleNavigate}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Navigate
                      </Button>
                      <div className="text-slate-400 text-sm">#{activeOrder.id}</div>
                  </div>
                </div>
                
                <h2 className="text-white text-xl mb-2">{activeOrder.customer_name}</h2>
                <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                    <div className="text-slate-300 text-sm">{activeOrder.delivery_address}</div>
                </div>

                <div className="flex items-center gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-1 text-emerald-400">
                        <Navigation className="w-4 h-4" />
                        <span>{route ? `${(route.distance / 1000).toFixed(1)} km` : '...'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{route ? `${(route.time / 60000).toFixed(0)} mins` : '...'}</span>
                    </div>
                </div>

                {/* Swipe to Confirm */}
                <div 
                  className="relative bg-emerald-600/30 border-2 border-emerald-600 rounded-xl h-14 overflow-hidden cursor-pointer select-none"
                  onMouseDown={handleSwipeStart}
                  onMouseMove={handleSwipeMove}
                  onMouseUp={handleSwipeEnd}
                  onMouseLeave={handleSwipeEnd}
                  onTouchStart={handleSwipeStart}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                >
                  <div 
                    className="absolute inset-0 bg-emerald-600 transition-all duration-100"
                    style={{ width: `${swipeProgress * 100}%` }}
                  />
                  <div 
                    className="absolute left-1 top-1 bottom-1 w-12 bg-white rounded-lg shadow-lg flex items-center justify-center transition-all duration-100"
                    style={{ 
                      left: isDragging ? `calc(${swipeProgress * 100}% - ${swipeProgress * 48}px)` : '4px'
                    }}
                  >
                    <ChevronRight className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-semibold drop-shadow-md text-sm">
                      {activeOrder.status === 'assigned' ? 'Swipe to Pick Up' : 'Swipe to Complete'}
                    </span>
                  </div>
                </div>
             </Card>
           ) : (
             <Card className="bg-slate-900/95 border-slate-700 p-6 text-center shadow-xl backdrop-blur-md">
               <h3 className="text-white text-lg mb-2">No Active Orders</h3>
               <p className="text-slate-400 text-sm">Wait for new assignments...</p>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}
