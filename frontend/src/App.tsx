import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RiderDashboard } from './pages/RiderDashboard';

type View = 'landing' | 'admin' | 'rider';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  return (
    <div className="size-full">
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      {currentView === 'admin' && (
        <AdminDashboard onBack={() => handleNavigate('landing')} />
      )}
      {currentView === 'rider' && (
        <RiderDashboard onBack={() => handleNavigate('landing')} />
      )}
    </div>
  );
}
