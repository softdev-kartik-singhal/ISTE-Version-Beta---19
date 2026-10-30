// Shell for signed-in screens: sidebar + top bar, with the current page rendered beside them.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { useApi } from '../hooks/useApi';
import { getSession } from '../services/api';

export default function AppLayout() {
  const session = useApi(getSession);
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
