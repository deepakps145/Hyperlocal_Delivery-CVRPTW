import { useState } from 'react';
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

interface RiderDashboardProps {
  onBack: () => void;
}

export function RiderDashboard({ onBack }: RiderDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleSwipeMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const progress = Math.min(Math.max((clientX - container.left) / container.width, 0), 1);
    setSwipeProgress(progress);
    
    if (progress > 0.9) {
      setSwipeProgress(0);
      setIsDragging(false);
      // Trigger pickup confirmation
    }
  };

  const handleSwipeEnd = () => {
    setIsDragging(false);
    if (swipeProgress < 0.9) {
      setSwipeProgress(0);
    }
  };

  const upcomingDeliveries = [
    { id: 1, location: 'Drop at HSR Layout', address: 'Sector 2, HSR Layout, Bangalore', distance: '3.8 km', type: 'Drop' },
    { id: 2, location: 'Drop at Koramangala', address: '5th Block, Koramangala, Bangalore', distance: '5.2 km', type: 'Drop' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Layout */}
      <div className="h-screen flex flex-col">
        {/* Header Section - Full Width */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-white text-lg">Online</span>
              <Switch 
                checked={isOnline} 
                onCheckedChange={setIsOnline}
                className="data-[state=checked]:bg-white"
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[300px,1fr] gap-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-white text-2xl mb-1">Rahul Mehta</h2>
                  <div className="flex items-center gap-2 text-emerald-100">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Ready for deliveries</span>
                  </div>
                </div>
              </div>

              {/* Earnings Summary Card - Wider on Desktop */}
              <Card className="bg-slate-900/90 border-0 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <DollarSign className="w-4 h-4" />
                      Today's Earnings
                    </div>
                    <div className="text-3xl text-white">₹847</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <Package className="w-4 h-4" />
                      Trips Completed
                    </div>
                    <div className="text-3xl text-white">12</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <Star className="w-4 h-4" />
                      Rating
                    </div>
                    <div className="text-3xl text-white">4.8</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <TrendingUp className="w-4 h-4" />
                      On-Time Rate
                    </div>
                    <div className="text-3xl text-white">98%</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Content Section - Full Width with Grid */}
        <div className="flex-1 overflow-auto px-6 lg:px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Active Delivery */}
              <div className="space-y-6">
                {/* Active Delivery Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-400 text-sm uppercase tracking-wider">Active Delivery</h3>
                  <Badge className="bg-blue-600 text-white border-0 px-4 py-1">
                    In Transit
                  </Badge>
                </div>

                {/* Active Delivery Card */}
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-600/50 border-2 p-8 space-y-6">
                  {/* Status Heading */}
                  <h2 className="text-white text-2xl">In Transit to Pickup</h2>
                  
                  {/* Location Info */}
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white text-xl mb-2">Pizza Hut, Indiranagar</div>
                      <div className="text-slate-400 mb-3">100 Feet Road, Bangalore</div>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 text-lg">2.4 km away</span>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-5 h-5" />
                          <span>8 mins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-4 pt-6 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Order ID</span>
                      <span className="text-white text-lg">#ORD-2846</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Items</span>
                      <span className="text-white">2 Pizzas, 1 Coke</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Earnings</span>
                      <span className="text-emerald-400 text-lg">₹65</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800 h-14"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Customer
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-14">
                      <Navigation className="w-5 h-5 mr-2" />
                      Navigate
                    </Button>
                  </div>
                </Card>

                {/* Swipe to Confirm */}
                <div className="space-y-3">
                  <div 
                    className="relative bg-emerald-600/30 border-2 border-emerald-600 rounded-2xl h-20 overflow-hidden cursor-pointer select-none"
                    onMouseDown={handleSwipeStart}
                    onMouseMove={handleSwipeMove}
                    onMouseUp={handleSwipeEnd}
                    onMouseLeave={handleSwipeEnd}
                    onTouchStart={handleSwipeStart}
                    onTouchMove={handleSwipeMove}
                    onTouchEnd={handleSwipeEnd}
                  >
                    {/* Background progress */}
                    <div 
                      className="absolute inset-0 bg-emerald-600 transition-all duration-100"
                      style={{ width: `${swipeProgress * 100}%` }}
                    />
                    
                    {/* Slider button */}
                    <div 
                      className="absolute left-1 top-1 bottom-1 w-16 bg-white rounded-xl shadow-lg flex items-center justify-center transition-all duration-100"
                      style={{ 
                        left: isDragging ? `calc(${swipeProgress * 100}% - ${swipeProgress * 64}px)` : '4px',
                        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <ChevronRight className="w-7 h-7 text-emerald-600" />
                    </div>
                    
                    {/* Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-lg">
                        Swipe to Confirm Pickup
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-slate-500">
                    Swipe right when you've collected the order
                  </p>
                </div>
              </div>

              {/* Right Column - Upcoming & Stats */}
              <div className="space-y-6">
                {/* Upcoming Deliveries */}
                <div>
                  <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4">Upcoming Deliveries</h3>
                  <div className="space-y-4">
                    {upcomingDeliveries.map((delivery) => (
                      <Card key={delivery.id} className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-lg mb-1">{delivery.location}</div>
                            <div className="text-slate-400 mb-3">{delivery.address}</div>
                            <div className="text-blue-400">{delivery.distance} from pickup</div>
                          </div>
                          <Badge className="bg-slate-700 text-slate-300 border-slate-600 flex-shrink-0">
                            {delivery.type}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
