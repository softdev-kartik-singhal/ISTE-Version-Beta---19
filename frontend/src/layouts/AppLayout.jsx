// Shell for signed-in screens: a full-height sidebar beside the page (desktop) or a bottom tab bar (phones), plus the top bar.
import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TourProvider } from '../tour/TourProvider';
import { CashProvider } from '../cash/CashProvider';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import BottomTabBar from '../components/layout/BottomTabBar';
import { useApi } from '../hooks/useApi';
import { getAccountFilter, getSession, isSignedIn, setAccountFilter } from '../services/api';

// Signed-out visitors go to the login screen; the shell itself only mounts once there is a token.
export default function AppLayout() {
  if (!isSignedIn()) return <Navigate to="/login" replace />;
  return <Shell />;
}

function Shell() {
  const { data: session } = useApi(getSession);
  const [account, setAccount] = useState(() => getAccountFilter() ?? 'all'); // 'all' or an account id
  const { pathname } = useLocation();
  if (!session) return null;
  if (account !== 'all' && getAccountFilter() == null) setAccount('all'); // the saved account no longer exists

  // Picking an account narrows every money view to it: the API layer adds it to each request and refetches the pages.
  function changeAccount(next) {
    setAccount(next);
    setAccountFilter(next);
  }

  return (
    <TourProvider tour={session.tour} userKey={session.user.email}>
    <CashProvider>
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <Sidebar session={session} />
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">
        <TopBar session={session} account={account} onAccountChange={changeAccount} />
        {/* Pages read the selected account (and the session) via useOutletContext(). */}
        <div key={pathname} className="tour-page">
          <Outlet context={{ account, session }} />
        </div>
      </div>
      <BottomTabBar session={session} />
    </div>
    </CashProvider>
    </TourProvider>
  );
}
