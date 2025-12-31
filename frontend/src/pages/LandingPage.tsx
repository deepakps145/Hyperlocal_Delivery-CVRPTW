import { Building2, Bike, Zap, MapPin, BarChart3, Route, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Route className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">GraphHopper</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onNavigate('admin-login')}
              className="text-slate-300 hover:text-white"
            >
              Admin Login
            </Button>
            <Button
              onClick={() => onNavigate('rider-login')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Rider Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Typography */}
          <div className="space-y-6 text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs sm:text-sm font-medium">TSP Algorithm Powered</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Hyperlocal Delivery
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Route Optimization
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0">
              Intelligent order grouping and route optimization using the Travelling Salesman Problem algorithm. Minimize delivery time and maximize efficiency.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button 
                onClick={() => onNavigate('admin-login')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 h-12 px-6 text-base"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Admin Dashboard
              </Button>
              <Button 
                onClick={() => onNavigate('rider-login')}
                variant="outline"
                className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 h-12 px-6 text-base"
              >
                <Bike className="w-5 h-5 mr-2" />
                Rider App
              </Button>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="relative h-[280px] sm:h-[350px] lg:h-[450px] animate-scale-up">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <DeliveryIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Intelligent Route Planning</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Our system uses advanced algorithms to optimize delivery routes in real-time
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-slate-900/50 border-slate-800 p-5 sm:p-6 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Route className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">TSP Algorithm</h3>
            <p className="text-sm text-slate-400">Optimal route calculation using Travelling Salesman Problem solver</p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-5 sm:p-6 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Live Tracking</h3>
            <p className="text-sm text-slate-400">Real-time GPS tracking of all riders and deliveries</p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-5 sm:p-6 hover:border-purple-500/30 transition-all group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Time Windows</h3>
            <p className="text-sm text-slate-400">Respect delivery time constraints and priorities</p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-5 sm:p-6 hover:border-amber-500/30 transition-all group">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-400">Performance metrics and delivery statistics</p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Fleet Admin Card */}
          <Card className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 p-6 sm:p-8 hover:border-emerald-400/50 transition-all group overflow-hidden cursor-pointer"
            onClick={() => onNavigate('admin-login')}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl text-white mb-2 font-semibold">Fleet Admin</h3>
                <p className="text-sm text-slate-400 mb-4">Manage orders, riders, and optimize delivery routes</p>
              </div>
              <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>

          {/* Rider Card */}
          <Card className="relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 p-6 sm:p-8 hover:border-blue-400/50 transition-all group overflow-hidden cursor-pointer"
            onClick={() => onNavigate('rider-login')}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative space-y-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bike className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl text-white mb-2 font-semibold">Delivery Partner</h3>
                <p className="text-sm text-slate-400 mb-4">View assigned orders and optimized delivery routes</p>
              </div>
              <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                <span>Open Rider App</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-400 text-sm">GraphHopper - Hyperlocal Delivery CVRPTW</span>
          </div>
          <p className="text-slate-500 text-xs">Powered by GraphHopper Route Optimization</p>
        </div>
      </footer>
    </div>
  );
}

// Delivery Route Illustration Component
function DeliveryIllustration() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-w-md">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
      
      {/* Background circles */}
      <circle cx="200" cy="200" r="180" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="2"/>
      <circle cx="200" cy="200" r="140" fill="rgba(59, 130, 246, 0.05)" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="2"/>
      <circle cx="200" cy="200" r="100" fill="rgba(139, 92, 246, 0.05)" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="2"/>
      
      {/* Animated Route lines */}
      <g filter="url(#glow)">
        <path d="M 100 280 Q 150 200 200 180 Q 250 160 300 200 Q 320 240 280 300" 
          fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 4">
          <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1s" repeatCount="indefinite"/>
        </path>
      </g>
      
      {/* Delivery points */}
      <g>
        {/* Point 1 - Start (Warehouse) */}
        <circle cx="100" cy="280" r="14" fill="rgba(16, 185, 129, 0.3)"/>
        <circle cx="100" cy="280" r="10" fill="#10b981"/>
        <text x="100" y="284" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">W</text>
        
        {/* Point 2 */}
        <circle cx="200" cy="180" r="12" fill="rgba(59, 130, 246, 0.3)"/>
        <circle cx="200" cy="180" r="8" fill="#3b82f6"/>
        <text x="200" y="184" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
        
        {/* Point 3 */}
        <circle cx="300" cy="200" r="12" fill="rgba(139, 92, 246, 0.3)"/>
        <circle cx="300" cy="200" r="8" fill="#8b5cf6"/>
        <text x="300" y="204" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">2</text>
        
        {/* Point 4 - End */}
        <circle cx="280" cy="300" r="12" fill="rgba(245, 158, 11, 0.3)"/>
        <circle cx="280" cy="300" r="8" fill="#f59e0b"/>
        <text x="280" y="304" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
      </g>
      
      {/* Rider icon in center */}
      <g transform="translate(175, 225)">
        <circle cx="25" cy="25" r="28" fill="rgba(16, 185, 129, 0.2)"/>
        <circle cx="25" cy="25" r="20" fill="#10b981"/>
        {/* Bike icon */}
        <path d="M17 28 L25 20 L33 28 L29 28 L29 32 L21 32 L21 28 Z" fill="white"/>
        <circle cx="25" cy="25" r="4" fill="white" fillOpacity="0.5"/>
      </g>
      
      {/* Labels */}
      <text x="100" y="310" textAnchor="middle" fill="rgba(148, 163, 184, 0.8)" fontSize="10">Origin</text>
      <text x="280" y="330" textAnchor="middle" fill="rgba(148, 163, 184, 0.8)" fontSize="10">Delivery</text>
    </svg>
  );
}