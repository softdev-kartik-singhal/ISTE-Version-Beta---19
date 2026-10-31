// Shell for signed-in screens: sidebar + top bar, with the current page rendered beside them.
import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
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
      <div className="pl-64">
        <TopBar session={session} account={account} onAccountChange={setAccount} />
        {/* Pages read the selected account via useOutletContext(). */}
        <Outlet context={{ account }} />
      </div>
    </div>
  );
}
