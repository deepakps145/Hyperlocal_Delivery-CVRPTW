import { Building2, Bike, Zap, MapPin, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface LandingPageProps {
  onNavigate: (view: 'admin' | 'rider') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left: Typography */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Powered by Graphhopper
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight">
              Hyperlocal Delivery, <span className="text-emerald-400">Optimized by Smart Routing</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400">
              Reduce delivery times with intelligent clustering.
            </p>
          </div>

          {/* Right: 3D Isometric Illustration */}
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <CityMapIllustration />
            </div>
          </div>
        </div>

        {/* Call to Action Area */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-xl sm:text-2xl text-white text-center mb-6 sm:mb-8">Choose Your Portal</h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Fleet Admin Card */}
            <Card className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 p-6 sm:p-8 hover:border-emerald-400/50 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative space-y-4 sm:space-y-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl text-white mb-2">Fleet Admin</h3>
                  <p className="text-sm sm:text-base text-slate-400">Manage your delivery fleet and optimize routes in real-time</p>
                </div>
                <Button 
                  onClick={() => onNavigate('admin')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/50"
                >
                  Login to Dashboard
                </Button>
              </div>
            </Card>

            {/* Delivery Partner Card */}
            <Card className="relative bg-slate-900/50 border-slate-700 p-6 sm:p-8 hover:border-slate-600 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative space-y-4 sm:space-y-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-700">
                  <Bike className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl text-white mb-2">Delivery Partner</h3>
                  <p className="text-sm sm:text-base text-slate-400">Access your rider dashboard and manage deliveries on the go</p>
                </div>
                <Button 
                  onClick={() => onNavigate('rider')}
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 shadow-sm"
                >
                  Login to Rider App
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="mt-16 sm:mt-20 lg:mt-24 grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl text-white">Smart Batching</h3>
            <p className="text-sm text-slate-400">AI-powered order grouping for maximum efficiency</p>
          </div>
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl text-white">Live Tracking</h3>
            <p className="text-sm text-slate-400">Real-time location updates for all deliveries</p>
          </div>
          <div className="text-center space-y-3 sm:space-y-4 sm:col-span-2 md:col-span-1">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg sm:text-xl text-white">Rider Analytics</h3>
            <p className="text-sm text-slate-400">Detailed performance metrics and insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3D Isometric City Map Illustration Component
function CityMapIllustration() {
  return (
    <svg viewBox="0 0 500 500" className="w-full h-full">
      {/* Background Grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1"/>
        </pattern>
        
        {/* Glow effect for routes */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="500" height="500" fill="url(#grid)" />
      
      {/* Buildings in isometric view */}
      {/* Building 1 - Tall */}
      <g transform="translate(100, 150)">
        <polygon points="0,50 40,30 40,0 0,20" fill="rgba(148, 163, 184, 0.3)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2"/>
        <polygon points="0,50 40,30 80,50 40,70" fill="rgba(100, 116, 139, 0.3)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="2"/>
        <polygon points="40,30 80,50 80,20 40,0" fill="rgba(203, 213, 225, 0.3)" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="2"/>
        {/* Windows */}
        <circle cx="50" cy="40" r="2" fill="rgba(251, 191, 36, 0.8)"/>
        <circle cx="60" cy="45" r="2" fill="rgba(251, 191, 36, 0.8)"/>
        <circle cx="70" cy="40" r="2" fill="rgba(251, 191, 36, 0.8)"/>
      </g>
      
      {/* Building 2 - Medium */}
      <g transform="translate(250, 200)">
        <polygon points="0,40 35,25 35,0 0,15" fill="rgba(148, 163, 184, 0.3)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2"/>
        <polygon points="0,40 35,25 70,40 35,55" fill="rgba(100, 116, 139, 0.3)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="2"/>
        <polygon points="35,25 70,40 70,15 35,0" fill="rgba(203, 213, 225, 0.3)" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="2"/>
        <circle cx="45" cy="35" r="2" fill="rgba(251, 191, 36, 0.8)"/>
        <circle cx="55" cy="30" r="2" fill="rgba(251, 191, 36, 0.8)"/>
      </g>
      
      {/* Building 3 - Short */}
      <g transform="translate(380, 280)">
        <polygon points="0,30 30,18 30,0 0,12" fill="rgba(148, 163, 184, 0.3)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2"/>
        <polygon points="0,30 30,18 60,30 30,42" fill="rgba(100, 116, 139, 0.3)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="2"/>
        <polygon points="30,18 60,30 60,12 30,0" fill="rgba(203, 213, 225, 0.3)" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="2"/>
        <circle cx="40" cy="25" r="2" fill="rgba(251, 191, 36, 0.8)"/>
      </g>
      
      {/* Building 4 - Tall */}
      <g transform="translate(180, 320)">
        <polygon points="0,45 38,28 38,0 0,17" fill="rgba(148, 163, 184, 0.3)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2"/>
        <polygon points="0,45 38,28 76,45 38,62" fill="rgba(100, 116, 139, 0.3)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="2"/>
        <polygon points="38,28 76,45 76,17 38,0" fill="rgba(203, 213, 225, 0.3)" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="2"/>
        <circle cx="48" cy="38" r="2" fill="rgba(251, 191, 36, 0.8)"/>
        <circle cx="58" cy="42" r="2" fill="rgba(251, 191, 36, 0.8)"/>
        <circle cx="64" cy="38" r="2" fill="rgba(251, 191, 36, 0.8)"/>
      </g>
      
      {/* Glowing Route Lines */}
      <g filter="url(#glow)">
        {/* Route 1 */}
        <path 
          d="M 120 180 Q 200 220, 270 230" 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.8)" 
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="120" cy="180" r="5" fill="rgba(16, 185, 129, 1)"/>
        <circle cx="270" cy="230" r="5" fill="rgba(16, 185, 129, 1)"/>
        
        {/* Route 2 */}
        <path 
          d="M 270 230 Q 330 260, 400 300" 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.8)" 
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="400" cy="300" r="5" fill="rgba(16, 185, 129, 1)"/>
        
        {/* Route 3 */}
        <path 
          d="M 270 230 Q 240 280, 210 345" 
          fill="none" 
          stroke="rgba(59, 130, 246, 0.8)" 
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="210" cy="345" r="5" fill="rgba(59, 130, 246, 1)"/>
      </g>
      
      {/* Delivery marker icons */}
      <g transform="translate(115, 165)">
        <circle cx="0" cy="0" r="8" fill="rgba(16, 185, 129, 0.3)"/>
        <circle cx="0" cy="0" r="4" fill="rgba(16, 185, 129, 1)"/>
      </g>
      <g transform="translate(265, 225)">
        <circle cx="0" cy="0" r="8" fill="rgba(16, 185, 129, 0.3)"/>
        <circle cx="0" cy="0" r="4" fill="rgba(16, 185, 129, 1)"/>
      </g>
      <g transform="translate(395, 295)">
        <circle cx="0" cy="0" r="8" fill="rgba(16, 185, 129, 0.3)"/>
        <circle cx="0" cy="0" r="4" fill="rgba(16, 185, 129, 1)"/>
      </g>
      <g transform="translate(205, 340)">
        <circle cx="0" cy="0" r="8" fill="rgba(59, 130, 246, 0.3)"/>
        <circle cx="0" cy="0" r="4" fill="rgba(59, 130, 246, 1)"/>
      </g>
    </svg>
  );
}