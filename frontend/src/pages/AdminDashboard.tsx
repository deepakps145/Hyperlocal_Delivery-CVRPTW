import { useState } from 'react';
import { 
  Map, 
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
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('map');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'orders', label: 'Order Pool', icon: Package },
    { id: 'riders', label: 'Rider Fleet', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const orders = [
    { id: 'ORD-2847', customer: 'Rajesh Kumar', status: 'pending', rider: 'Unassigned', time: '2 min ago' },
    { id: 'ORD-2846', customer: 'Priya Sharma', status: 'in-transit', rider: 'Rahul M.', time: '8 min ago' },
    { id: 'ORD-2845', customer: 'Amit Patel', status: 'picked-up', rider: 'Suresh K.', time: '12 min ago' },
    { id: 'ORD-2844', customer: 'Neha Singh', status: 'in-transit', rider: 'Vijay R.', time: '15 min ago' },
    { id: 'ORD-2843', customer: 'Karthik Reddy', status: 'delivered', rider: 'Arun S.', time: '18 min ago' },
  ];

  const riders = [
    { id: 1, name: 'Rahul M.', x: 35, y: 40, status: 'busy', orders: 3 },
    { id: 2, name: 'Suresh K.', x: 55, y: 30, status: 'busy', orders: 2 },
    { id: 3, name: 'Vijay R.', x: 70, y: 55, status: 'busy', orders: 1 },
    { id: 4, name: 'Arun S.', x: 25, y: 65, status: 'available', orders: 0 },
  ];

  const orderMarkers = [
    { id: 1, x: 40, y: 25, type: 'pending' },
    { id: 2, x: 60, y: 45, type: 'pending' },
    { id: 3, x: 80, y: 35, type: 'pending' },
    { id: 4, x: 30, y: 70, type: 'assigned' },
  ];

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
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
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
            <Card className="bg-slate-900 border-red-500/30 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Pending Orders</div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">23</div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-emerald-500/30 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Active Riders</div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">
                    8<span className="text-base sm:text-lg text-slate-500">/12</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-blue-500/30 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                    Avg Delivery Time
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl text-white mt-1">24m</div>
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
            <MapView 
              riders={riders} 
              orderMarkers={orderMarkers}
              showTraffic={showTraffic}
              showHeatmap={showHeatmap}
            />
          </div>

          {/* Floating Action Panel */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-64 sm:w-80 space-y-4">
            <Card className="bg-slate-900/95 backdrop-blur-sm border-slate-700 p-3 sm:p-4">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/50 text-sm sm:text-base h-10 sm:h-auto">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Auto-Assign Routes
              </Button>
              
              <div className="mt-3 sm:mt-4 space-y-3 pt-3 sm:pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm">
                    <MapPin className="w-4 h-4" />
                    Show Traffic
                  </div>
                  <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm">
                    <Layers className="w-4 h-4" />
                    Show Heatmap
                  </div>
                  <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Drawer - Recent Orders */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700">
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white text-sm sm:text-base">Recent Orders</h3>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs sm:text-sm">
                View All
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </div>
            <ScrollArea className="h-32 sm:h-48">
              <div className="p-3 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 items-center text-xs sm:text-sm">
                        <div>
                          <div className="text-white">{order.id}</div>
                          <div className="text-slate-500 text-xs hidden sm:block">{order.time}</div>
                        </div>
                        <div className="text-slate-300 hidden sm:block">{order.customer}</div>
                        <div>
                          <Badge 
                            variant={order.status === 'pending' ? 'destructive' : order.status === 'delivered' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              order.status === 'pending' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {order.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="text-slate-400 hidden sm:block">{order.rider}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map View Component
interface MapViewProps {
  riders: Array<{ id: number; name: string; x: number; y: number; status: string; orders: number }>;
  orderMarkers: Array<{ id: number; x: number; y: number; type: string }>;
  showTraffic: boolean;
  showHeatmap: boolean;
}

function MapView({ riders, orderMarkers, showTraffic, showHeatmap }: MapViewProps) {
  return (
    <div className="w-full h-full relative bg-slate-950">
      {/* Grid pattern for map */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71, 85, 105, 0.3)" strokeWidth="1"/>
          </pattern>
          
          {showHeatmap && (
            <radialGradient id="heatmap-gradient">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.2)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
            </radialGradient>
          )}
        </defs>
        
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        
        {/* Heatmap overlay */}
        {showHeatmap && (
          <>
            <circle cx="40%" cy="30%" r="150" fill="url(#heatmap-gradient)" opacity="0.5" />
            <circle cx="65%" cy="50%" r="120" fill="url(#heatmap-gradient)" opacity="0.5" />
          </>
        )}
        
        {/* Routes */}
        {riders.filter(r => r.status === 'busy').map((rider, idx) => (
          <g key={`route-${rider.id}`}>
            <path
              d={`M ${rider.x}% ${rider.y}% Q ${rider.x + 10}% ${rider.y - 5}%, ${rider.x + 20}% ${rider.y + 10}%`}
              fill="none"
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </g>
        ))}
        
        {/* Order Markers */}
        {orderMarkers.map((marker) => (
          <g key={marker.id} transform={`translate(${marker.x}%, ${marker.y}%)`}>
            <circle 
              cx="0" 
              cy="0" 
              r="8" 
              fill={marker.type === 'pending' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'} 
            />
            <circle 
              cx="0" 
              cy="0" 
              r="4" 
              fill={marker.type === 'pending' ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'} 
            />
          </g>
        ))}
        
        {/* Rider Icons */}
        {riders.map((rider) => (
          <g key={rider.id} transform={`translate(${rider.x}%, ${rider.y}%)`}>
            <circle 
              cx="0" 
              cy="0" 
              r="12" 
              fill={rider.status === 'available' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)'} 
            />
            <circle 
              cx="0" 
              cy="0" 
              r="8" 
              fill={rider.status === 'available' ? 'rgba(16, 185, 129, 1)' : 'rgba(251, 191, 36, 1)'} 
            />
            {rider.orders > 0 && (
              <circle 
                cx="8" 
                cy="-8" 
                r="6" 
                fill="rgba(239, 68, 68, 1)" 
              />
            )}
          </g>
        ))}
      </svg>
      
      {/* Traffic overlay */}
      {showTraffic && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-32 h-1 bg-red-500/50"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-1 bg-amber-500/50"></div>
        </div>
      )}
    </div>
  );
}