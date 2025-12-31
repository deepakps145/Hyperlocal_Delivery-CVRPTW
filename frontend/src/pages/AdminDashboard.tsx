import { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles,
  Clock,
  TrendingDown,
  TrendingUp,
  MapPin,
  Bike,
  Phone,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  Layers,
  ArrowLeft,
  Menu,
  X,
  Plus,
  XCircle,
  Trash2,
  Navigation,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Timer,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { MapComponent } from '../components/MapComponent';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { getOrders, getRiders, autoAssignOrders, cancelOrder, deleteOrder, optimizeRoute } from '../services/api';
// import { useWebSocket } from '../services/websocket';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('map');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'assigned' | 'in-transit' | 'riders'>('all');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [ridersExpanded, setRidersExpanded] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [riderRoute, setRiderRoute] = useState<any>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket - disabled for debugging
  const isConnected = false;
  const lastMessage: any = null;

  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket message received:', lastMessage);
      
      // Handle different message types
      if (lastMessage.type === 'order_cancelled' || lastMessage.type === 'order_update' || 
          lastMessage.type === 'order_assigned' || lastMessage.type === 'order_deleted') {
        fetchOrders();
      }
      
      if (lastMessage.type === 'rider_update') {
        // Update specific rider in state to avoid full re-fetch and map reload
        setRiders(prevRiders => prevRiders.map(rider => 
          rider.id === lastMessage.data.rider_id 
            ? { ...rider, current_lat: lastMessage.data.lat, current_lng: lastMessage.data.lng }
            : rider
        ));
      }

      if (lastMessage.type === 'route_updated' && lastMessage.data.rider_id === selectedRider) {
        setRiderRoute(lastMessage.data.route);
      }
    }
  }, [lastMessage, selectedRider]);

  const fetchOrders = async () => {
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchRiders = async () => {
    try {
      const ridersData = await getRiders();
      setRiders(ridersData);
    } catch (error) {
      console.error("Error fetching riders:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('AdminDashboard: Fetching data...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - Backend may not be running')), 10000)
        );
        
        const dataPromise = Promise.all([
          getOrders(),
          getRiders()
        ]);
        
        const [ordersData, ridersData] = await Promise.race([dataPromise, timeoutPromise]) as [any[], any[]];
        
        console.log('AdminDashboard: Fetched orders:', ordersData.length, 'riders:', ridersData.length);
        setOrders(ordersData);
        setRiders(ridersData);
        setError(null);
      } catch (error: any) {
        console.error("AdminDashboard: Error fetching data:", error);
        if (error.response?.status === 401) {
          // Auth failed - redirect to login
          setError('Session expired. Redirecting to login...');
          setTimeout(() => onBack(), 1500);
          return;
        }
        setError(error.message || 'Failed to load data. Please check if the backend server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchRiders()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const result = await autoAssignOrders();
      console.log('Auto-assign result:', result);
      await Promise.all([fetchOrders(), fetchRiders()]);
      alert(`Successfully assigned ${result.assigned || 0} orders to ${result.riders_used || 0} riders`);
    } catch (error: any) {
      console.error("Error auto-assigning orders:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleOrderCreated = async () => {
    // Refresh orders after creating new one
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };

  const handleCancelOrder = async (orderId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await cancelOrder(orderId);
      await fetchOrders();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      alert(`Failed to cancel order: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;

    try {
      await deleteOrder(orderId);
      await fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      alert(`Failed to delete order: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleViewRiderRoute = async (riderId: number) => {
    if (selectedRider === riderId) {
      setSelectedRider(null);
      setRiderRoute(null);
      return;
    }
    
    setSelectedRider(riderId);
    try {
      const route = await optimizeRoute(riderId, false);
      setRiderRoute(route);
    } catch (e) {
      console.log("No route available for rider", e);
      setRiderRoute(null);
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    if (isCreateOrderOpen) {
      setSelectedLocation({ lat: latlng[0], lng: latlng[1] });
    }
  };

  const getFilteredMapData = () => {
    let filteredOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    let filteredRiders = riders;

    if (filterMode === 'pending') {
      filteredOrders = filteredOrders.filter(o => o.status === 'pending');
      filteredRiders = [];
    } else if (filterMode === 'assigned') {
      filteredOrders = filteredOrders.filter(o => o.status === 'assigned');
      filteredRiders = []; // Don't show riders when filtering assigned orders
    } else if (filterMode === 'in-transit') {
      filteredOrders = filteredOrders.filter(o => o.status === 'in-transit');
      filteredRiders = []; // Don't show riders when filtering in-transit orders
    } else if (filterMode === 'riders') {
      filteredOrders = [];
      filteredRiders = riders.filter(r => r.status === 'available' || r.status === 'busy');
    }

    return { filteredOrders, filteredRiders };
  };

  const { filteredOrders, filteredRiders } = getFilteredMapData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'assigned': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'in-transit': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'delivered': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Timer className="w-3 h-3" />;
      case 'assigned': return <Package className="w-3 h-3" />;
      case 'in-transit': return <Navigation className="w-3 h-3" />;
      case 'delivered': return <CheckCircle2 className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Calculate stats
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    assigned: orders.filter(o => o.status === 'assigned').length,
    inTransit: orders.filter(o => o.status === 'in-transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    activeRiders: riders.filter(r => r.status === 'available' || r.status === 'busy').length,
    totalRiders: riders.length
  };

  // Debug: Show immediately that component rendered
  console.log('AdminDashboard: Rendering, isLoading=', isLoading, 'error=', error);

  // Show loading state
  if (isLoading) {
    console.log('AdminDashboard: Showing loading spinner');
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#0f172a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            border: '4px solid #10b981', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div style={{ color: 'white', fontSize: '20px' }}>Loading Admin Dashboard...</div>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Connecting to backend...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('AdminDashboard: Showing error state');
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#0f172a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <div style={{ color: '#ef4444', fontSize: '20px', marginBottom: '16px' }}>⚠️ Error</div>
          <div style={{ color: 'white', marginBottom: '24px' }}>{error}</div>
          <button 
            onClick={onBack} 
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-screen bg-slate-950 flex overflow-hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900 text-white hover:bg-slate-800"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Left Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">GraphHopper</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-4 space-y-4">
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <Button 
                onClick={() => setIsCreateOrderOpen(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 h-10 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
              
              <Button 
                onClick={handleAutoAssign}
                disabled={isAutoAssigning || stats.pending === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 h-10 disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${isAutoAssigning ? 'animate-spin' : ''}`} />
                {isAutoAssigning ? 'Assigning...' : `Auto-Assign (${stats.pending})`}
              </Button>

              <Button
                variant="outline"
                onClick={handleRefresh}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-9"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>

            {/* Orders Section */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOrdersExpanded(!ordersExpanded)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Orders</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                    {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                  </Badge>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${ordersExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {ordersExpanded && (
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">No active orders</div>
                  ) : (
                    orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map((order) => (
                      <div 
                        key={order.id} 
                        className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 flex items-center gap-1 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-white font-medium truncate mb-1">{order.customer_name}</div>
                        <div className="text-xs text-slate-500 truncate mb-2">{order.delivery_address}</div>
                        
                        {/* Order Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              onClick={(e) => handleCancelOrder(order.id, e)}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={(e) => handleDeleteOrder(order.id, e)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Riders Section */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setRidersExpanded(!ridersExpanded)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Riders</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    {stats.activeRiders}/{stats.totalRiders}
                  </Badge>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${ridersExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {ridersExpanded && (
                <div className="p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {riders.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">No riders available</div>
                  ) : (
                    riders.map((rider) => (
                      <div 
                        key={rider.id} 
                        className={`p-3 rounded-lg transition-all cursor-pointer ${
                          selectedRider === rider.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800/30 hover:bg-slate-800/60'
                        }`}
                        onClick={() => handleViewRiderRoute(rider.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              rider.status === 'busy' ? 'bg-amber-500' : 
                              rider.status === 'available' ? 'bg-emerald-500' : 'bg-slate-500'
                            } ${rider.status !== 'offline' ? 'animate-pulse' : ''}`}></div>
                            <span className="text-sm text-white font-medium">{rider.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                            {orders.filter(o => o.rider_id === rider.id && o.status !== 'delivered').length} orders
                          </Badge>
                        </div>
                        {selectedRider === rider.id && (
                          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Viewing route on map
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Map Controls */}
            <div className="border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Map Controls</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Show Traffic</span>
                <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Stats Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Pending */}
            <Card 
              className={`flex-1 min-w-[100px] bg-slate-900/50 border-amber-500/30 p-2 sm:p-3 cursor-pointer transition-all ${
                filterMode === 'pending' ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'
              }`}
              onClick={() => setFilterMode(filterMode === 'pending' ? 'all' : 'pending')}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  filterMode === 'pending' ? 'bg-amber-500' : 'bg-amber-500/20'
                }`}>
                  <Timer className={`w-4 h-4 ${filterMode === 'pending' ? 'text-white' : 'text-amber-400'}`} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">{stats.pending}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Pending</div>
                </div>
              </div>
            </Card>

            {/* Assigned */}
            <Card 
              className={`flex-1 min-w-[100px] bg-slate-900/50 border-blue-500/30 p-2 sm:p-3 cursor-pointer transition-all ${
                filterMode === 'assigned' ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800'
              }`}
              onClick={() => setFilterMode(filterMode === 'assigned' ? 'all' : 'assigned')}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  filterMode === 'assigned' ? 'bg-blue-500' : 'bg-blue-500/20'
                }`}>
                  <Package className={`w-4 h-4 ${filterMode === 'assigned' ? 'text-white' : 'text-blue-400'}`} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">{stats.assigned}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Assigned</div>
                </div>
              </div>
            </Card>

            {/* In Transit */}
            <Card 
              className={`flex-1 min-w-[100px] bg-slate-900/50 border-purple-500/30 p-2 sm:p-3 cursor-pointer transition-all ${
                filterMode === 'in-transit' ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : 'hover:bg-slate-800'
              }`}
              onClick={() => setFilterMode(filterMode === 'in-transit' ? 'all' : 'in-transit')}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  filterMode === 'in-transit' ? 'bg-purple-500' : 'bg-purple-500/20'
                }`}>
                  <Navigation className={`w-4 h-4 ${filterMode === 'in-transit' ? 'text-white' : 'text-purple-400'}`} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">{stats.inTransit}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">In Transit</div>
                </div>
              </div>
            </Card>

            {/* Active Riders */}
            <Card 
              className={`flex-1 min-w-[100px] bg-slate-900/50 border-emerald-500/30 p-2 sm:p-3 cursor-pointer transition-all ${
                filterMode === 'riders' ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-800'
              }`}
              onClick={() => setFilterMode(filterMode === 'riders' ? 'all' : 'riders')}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  filterMode === 'riders' ? 'bg-emerald-500' : 'bg-emerald-500/20'
                }`}>
                  <Bike className={`w-4 h-4 ${filterMode === 'riders' ? 'text-white' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">{stats.activeRiders}<span className="text-sm text-slate-500">/{stats.totalRiders}</span></div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Riders</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900">
            <MapComponent 
              orders={filteredOrders} 
              riders={filteredRiders} 
              route={riderRoute}
              showTraffic={showTraffic} 
              onMapClick={handleMapClick}
            />
          </div>

          {/* Filter indicator */}
          {filterMode !== 'all' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
              <Badge 
                className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 px-3 py-1 text-sm cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setFilterMode('all')}
              >
                Filtering: {filterMode} <X className="w-3 h-3 ml-2 inline" />
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Order Modal */}
      <CreateOrderModal 
        isOpen={isCreateOrderOpen}
        onClose={() => {
          setIsCreateOrderOpen(false);
          setSelectedLocation(null);
        }}
        onOrderCreated={handleOrderCreated}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
