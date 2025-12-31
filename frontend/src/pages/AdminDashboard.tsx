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
  MapPin,
  Bike,
  Phone,
  ChevronRight,
  ToggleLeft,
  Layers,
  ArrowLeft,
  Menu,
  X,
  Plus,
  XCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { MapComponent } from '../components/MapComponent';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { getOrders, getRiders, autoAssignOrders, cancelOrder } from '../services/api';
import { useWebSocket } from '../services/websocket';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('map');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'riders'>('all');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8000/ws');

  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket message received:', lastMessage);
      
      // Handle different message types
      if (lastMessage.type === 'order_cancelled' || lastMessage.type === 'order_update' || lastMessage.type === 'order_assigned') {
        // Refresh orders when changes occur
        fetchOrders();
      }
      
      if (lastMessage.type === 'rider_update') {
        // Refresh riders when changes occur
        fetchRiders();
      }
    }
  }, [lastMessage]);

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
        const [ordersData, ridersData] = await Promise.all([
          getOrders(),
          getRiders()
        ]);
        console.log('AdminDashboard: Fetched orders:', ordersData.length, 'riders:', ridersData.length);
        setOrders(ordersData);
        setRiders(ridersData);
        setError(null);
      } catch (error: any) {
        console.error("AdminDashboard: Error fetching data:", error);
        if (error.response?.status !== 401) {
          setError(`Failed to load data: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Reduced polling interval since we have WebSocket
    const interval = setInterval(fetchData, 30000); // 30 seconds instead of 10
    return () => clearInterval(interval);
  }, []);

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const result = await autoAssignOrders();
      console.log('Auto-assign result:', result);
      // Refresh orders and riders after assignment
      const [ordersData, ridersData] = await Promise.all([
        getOrders(),
        getRiders()
      ]);
      setOrders(ordersData);
      setRiders(ridersData);
      alert(`Successfully assigned ${result.assignments?.length || 0} order groups to riders`);
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

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This will trigger re-routing for the assigned rider.')) {
      return;
    }

    try {
      const result = await cancelOrder(orderId);
      console.log('Order cancelled:', result);
      alert(`Order #${orderId} cancelled successfully${result.re_optimized ? ' and rider route re-optimized' : ''}`);
      // WebSocket will trigger refresh, but do it manually too
      await fetchOrders();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      alert(`Failed to cancel order: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    if (isCreateOrderOpen) {
      setSelectedLocation({ lat: latlng[0], lng: latlng[1] });
    }
  };

  const menuItems = [
    { id: 'map', label: 'Live Map', icon: MapIcon },
  ];

  // Filter data for map
  const getFilteredMapData = () => {
    let filteredOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    let filteredRiders = riders;

    if (filterMode === 'pending') {
      filteredOrders = filteredOrders.filter(o => o.status === 'pending');
      filteredRiders = [];
    } else if (filterMode === 'riders') {
      filteredOrders = [];
      filteredRiders = riders.filter(r => r.status === 'available' || r.status === 'busy');
    }

    return { filteredOrders, filteredRiders };
  };

  const { filteredOrders, filteredRiders } = getFilteredMapData();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
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
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900 text-white hover:bg-slate-800"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar Navigation */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-white">RouteAI</span>
              {isConnected && (
                <div className="ml-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeMenu === item.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Recent Orders Section in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Recent Orders
            </h3>
            <div className="space-y-1 px-2">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-white">#{order.id}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1 py-0 h-4 ${
                        order.status === 'pending' ? 'text-red-400 border-red-500/30' :
                        order.status === 'delivered' ? 'text-emerald-400 border-emerald-500/30' :
                        'text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{order.customer_name}</div>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-slate-500 hover:text-white mt-2"
                onClick={() => setActiveMenu('orders')} // Assuming you might want a full list view later
              >
                View All Orders
              </Button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              DM
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">Dispatch Manager</div>
              <div className="text-xs text-slate-400 truncate">admin@routeai.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Stats Bar */}
        <div className="p-4 sm:p-6 bg-slate-900/50 border-b border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card 
              className={`bg-slate-900 border-red-500/30 p-3 sm:p-4 cursor-pointer transition-all ${filterMode === 'pending' ? 'ring-2 ring-red-500' : 'hover:bg-slate-800'}`}
              onClick={() => setFilterMode(filterMode === 'pending' ? 'all' : 'pending')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Pending Orders</div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Card>

            <Card 
              className={`bg-slate-900 border-emerald-500/30 p-3 sm:p-4 cursor-pointer transition-all ${filterMode === 'riders' ? 'ring-2 ring-emerald-500' : 'hover:bg-slate-800'}`}
              onClick={() => setFilterMode(filterMode === 'riders' ? 'all' : 'riders')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Active Riders</div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">
                    {riders.filter(r => r.status === 'available' || r.status === 'busy').length}
                    <span className="text-base sm:text-lg text-slate-500">/{riders.length}</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Card>

            <Card 
              className={`bg-slate-900 border-blue-500/30 p-3 sm:p-4 sm:col-span-2 lg:col-span-1 cursor-pointer transition-all ${filterMode === 'all' ? 'ring-2 ring-blue-500' : 'hover:bg-slate-800'}`}
              onClick={() => setFilterMode('all')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                    Total Orders
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">{orders.length}</div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Map and Control Panel Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Main Map Interface */}
          <div className="absolute inset-0 bg-slate-900">
            <MapComponent 
              orders={filteredOrders} 
              riders={filteredRiders} 
              showTraffic={showTraffic} 
              onMapClick={handleMapClick}
            />
          </div>

          {/* Floating Action Panel */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-64 sm:w-80 space-y-4 z-[1000]">
            <Card className="bg-slate-900/95 backdrop-blur-sm border-slate-700 p-3 sm:p-4">
              <Button 
                onClick={() => setIsCreateOrderOpen(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/50 text-sm sm:text-base h-10 sm:h-auto mb-3"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Create New Order
              </Button>
              
              <Button 
                onClick={handleAutoAssign}
                disabled={isAutoAssigning}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/50 text-sm sm:text-base h-10 sm:h-auto disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {isAutoAssigning ? 'Assigning...' : 'Auto-Assign Routes'}
              </Button>
              
              <div className="mt-3 sm:mt-4 space-y-3 pt-3 sm:pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm">
                    <MapPin className="w-4 h-4" />
                    Show Traffic
                  </div>
                  <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
                </div>
              </div>
            </Card>
          </div>
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

