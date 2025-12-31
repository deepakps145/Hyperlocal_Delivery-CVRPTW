import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { login } from '../services/api';
import { ShieldCheck, Loader2, ArrowLeft, Route, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (data: any) => void;
  onNavigateToSignup: () => void;
  onBack?: () => void;
}

export function AdminLogin({ onLoginSuccess, onNavigateToSignup, onBack }: LoginProps) {
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
      const data = await login({ email, password });
      if (data.role !== 'admin') {
        setError('Access denied. Not an admin account.');
        return;
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Back Button */}
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-400 hover:text-white z-10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      )}

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-800 p-8 relative z-10 animate-scale-up shadow-2xl shadow-purple-500/5">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your fleet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Email Address</Label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="bg-slate-800/50 border-slate-700 text-white h-12 focus:border-purple-500 focus:ring-purple-500/20 transition-all placeholder:text-slate-500"
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
                className="bg-slate-800/50 border-slate-700 text-white h-12 pr-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all placeholder:text-slate-500"
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
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-12 shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In as Admin'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Need an admin account?{' '}
            <button 
              onClick={onNavigateToSignup}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign up here
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
