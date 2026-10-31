// Route map: public pages (landing, auth) and the signed-in app screens inside AppLayout.
// Main tabs: Home (/dashboard), Ask, Spending, Plan. The other screens are reached from More or from links on those tabs.
// Pages are lazy-loaded so each screen downloads only when it is first opened.
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Ask = lazy(() => import('./pages/Ask'));
const Spending = lazy(() => import('./pages/Spending'));
const Plan = lazy(() => import('./pages/Plan'));
const Trends = lazy(() => import('./pages/Trends'));
const MoneyFlow = lazy(() => import('./pages/MoneyFlow'));
const Goals = lazy(() => import('./pages/Goals'));
const SurplusPlan = lazy(() => import('./pages/SurplusPlan'));
const Statements = lazy(() => import('./pages/Statements'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Flags = lazy(() => import('./pages/Flags'));
const TrackRecord = lazy(() => import('./pages/TrackRecord'));
const Privacy = lazy(() => import('./pages/Privacy'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/spending" element={<Spending />} />
          <Route path="/plan" element={<Plan />} />
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
    </Suspense>
  );
}
