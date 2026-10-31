// Shell for signed-in screens: sidebar + top bar, with the current page rendered beside them.
import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TourProvider } from '../tour/TourProvider';
import { CashProvider } from '../cash/CashProvider';
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
  const { pathname } = useLocation();
  if (!session) return null;

  return (
    <TourProvider tour={session.tour} userKey={session.user.email}>
    <CashProvider>
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen">
      <Sidebar session={session} />
      <div className="pl-64">
        <TopBar session={session} account={account} onAccountChange={setAccount} />
        {/* Pages read the selected account via useOutletContext(). */}
        <div key={pathname} className="tour-page">
          <Outlet context={{ account }} />
        </div>
      </div>
    </div>
    </CashProvider>
    </TourProvider>
  );
}
