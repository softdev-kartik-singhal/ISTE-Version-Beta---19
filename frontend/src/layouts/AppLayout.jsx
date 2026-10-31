// Shell for signed-in screens: sidebar (large screens) or bottom tab bar (phones), top bar, and the current page.
import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import BottomTabBar from '../components/layout/BottomTabBar';
import { useApi } from '../hooks/useApi';
import { getSession, isSignedIn } from '../services/api';

// Signed-out visitors go to the login screen; the shell itself only mounts once there is a token.
export default function AppLayout() {
  if (!isSignedIn()) return <Navigate to="/login" replace />;
  return <Shell />;
}

function Shell() {
  const { data: session } = useApi(getSession);
  const [account, setAccount] = useState('all');
  if (!session) return null;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen">
      <Sidebar session={session} />
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <TopBar session={session} account={account} onAccountChange={setAccount} />
        {/* Pages read the selected account via useOutletContext(). */}
        <Outlet context={{ account, session }} />
      </div>
      <BottomTabBar session={session} />
    </div>
  );
}
