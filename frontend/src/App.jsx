// Route map: public pages (landing, auth) and the signed-in app screens inside AppLayout.
import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Ask from './pages/Ask';
import Trends from './pages/Trends';
import MoneyFlow from './pages/MoneyFlow';
import Goals from './pages/Goals';
import SurplusPlan from './pages/SurplusPlan';
import Statements from './pages/Statements';
import Transactions from './pages/Transactions';
import Flags from './pages/Flags';
import TrackRecord from './pages/TrackRecord';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/money-flow" element={<MoneyFlow />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/surplus-plan" element={<SurplusPlan />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/flags" element={<Flags />} />
        <Route path="/track-record" element={<TrackRecord />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>
    </Routes>
  );
}
