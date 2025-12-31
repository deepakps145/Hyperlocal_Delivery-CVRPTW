import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { signup } from '../services/api';
import { Bike, Loader2, Route, Eye, EyeOff } from 'lucide-react';

interface SignupProps {
  onSignupSuccess: (data: any) => void;
  onNavigateToLogin: () => void;
}

export function RiderSignup({ onSignupSuccess, onNavigateToLogin }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await signup({ name, email, password, role: 'rider' });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data));
      onSignupSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-800 p-8 relative z-10 animate-scale-up shadow-2xl shadow-emerald-500/5">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Route className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">GraphHopper</span>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Rider Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join the delivery fleet today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Full Name</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-slate-800/50 border-slate-700 text-white h-12 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Email Address</Label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@example.com"
              className="bg-slate-800/50 border-slate-700 text-white h-12 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Password</Label>
            <div className="relative">
              <Input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800/50 border-slate-700 text-white h-12 pr-10 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-12 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Rider Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <button 
              onClick={onNavigateToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
