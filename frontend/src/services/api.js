// Data access layer: every screen reads and writes through here, and only here, using the signed-in user's session token.
// Backend answers are reshaped for the screens by adapters.js.
import { setGoalBase } from '../utils/goalMath';
import { goalDate, monthLabel, suggestions, toFlags, toGoals, toMoneyFlow, toSafeguards, toStatements, toSurplusPlan, toTrackRecord, toTransactions, toTrends } from './adapters';
import { toHome } from './homeView';

export { toAsk } from './adapters'; // Ask re-shapes its stored answer when the bonus switch changes

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'sg_token';

// Session token. localStorage keeps the user signed in across reloads; the server expires it after 12 hours.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isSignedIn = () => Boolean(getToken());

// Screens subscribe to changes: after any write (upload, correction, goal edit...) every mounted page refetches.
const listeners = new Set();
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const invalidate = () => listeners.forEach((fn) => fn());

// Calls the backend and returns its JSON. Failures throw an Error with the server's message,
// plus .status and .code (e.g. CARD_NOT_VERIFIED) so screens can react.
export async function request(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
  } catch {
    throw Object.assign(new Error('Cannot reach the SmartGullak server.'), { status: 0, code: 'NETWORK' });
  }
  const data = await response.json().catch(() => null);
  if (response.ok) return data;
  const detail = data?.detail;
  const reason = detail?.reason || (Array.isArray(detail) ? 'Check the details you entered.' : 'Something went wrong.');
  if (response.status === 401 && reason === 'Sign in required.') {
    clearToken(); // the token is gone or expired: back to the login screen
    window.location.assign('/login');
  }
  throw Object.assign(new Error(reason), { status: response.status, code: detail?.code });
}

// ---------- sign-in ----------

export async function login(email, password) {
  const { token } = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  setToken(token);
  invalidate();
  return getSession();
}

// One-click demo: the backend signs in as the demo user and loads the planted demo dataset for them if it is not loaded yet.
export async function demoLogin() {
  const { token } = await request('/api/auth/demo', { method: 'POST' });
  setToken(token);
  invalidate();
  return getSession();
}

// Creates the account and signs in, so the next step (registering the card) is already authenticated.
export async function signup({ name, email, password }) {
  const { token } = await request('/api/auth/signup', { method: 'POST', body: { name, email, password } });
  setToken(token);
  invalidate();
  return getSession();
}

export function requestPasswordReset(email) {
  return request('/api/auth/reset', { method: 'POST', body: { email } });
}

export async function logout() {
  await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  invalidate();
}

// "2026-10-31 10:45:12" (UTC, from the server) -> "31 Oct, 4:15 pm" in the user's timezone.
function formatSynced(utc) {
  if (!utc) return 'Never';
  return new Date(`${utc.replace(' ', 'T')}Z`).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export async function getSession() {
  const s = await request('/api/session');
  const banks = [...new Set(s.accounts.map((a) => a.split(' ')[0]))];
  return {
    user: { name: s.user.name, email: s.user.email, profile: s.user.profile || '' },
    accountCount: s.accountCount,
    accounts: s.accounts,
    bankCount: s.accountList.filter((a) => a.type !== 'cash').length,
    hasCash: s.accountList.some((a) => a.type === 'cash'),
    statementsUpTo: s.statementsUpTo ? new Date(`${s.statementsUpTo}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
    lastSynced: formatSynced(s.lastSyncedAt),
    syncSummary: banks.length ? `${banks.join(', ')} synced` : 'No statements uploaded yet',
    flagCount: s.flagCount,
    tour: s.tour,
  };
}

// Saves how far the first-time tour got. completed=true also means skipped; completed=false, step=0 replays it.
export async function saveTour(completed, step) {
  const tour = await request('/api/tour', { method: 'PUT', body: { completed, step } });
  invalidate();
  return tour;
}

// ---------- privacy, export, delete ----------

export async function getPrivacy() {
  const p = await request('/api/privacy');
  return {
    auditTrail: p.auditTrail || 'SG-NO-LOG',
    hardwareKey: p.card ? `••${p.card.last4}` : 'No card',
    card: p.card ? { last4: p.card.last4, added: new Date(`${p.card.addedAt.replace(' ', 'T')}Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), firmware: 'n/a' } : null,
    maskedAccount: p.maskedAccount || 'no account yet',
    exportFileName: p.exportFileName,
  };
}

// Step 1 of a sensitive action. The server remembers it for 60 seconds; step 2 is the card tap.
export async function verifyPassword(password) {
  await request('/api/auth/verify-password', { method: 'POST', body: { password } });
  return true;
}

// Rows for the "Export my data" CSV (needs the password + card steps just completed).
export async function exportUserData() {
  const { transactions } = await request('/api/data/export', { method: 'POST' });
  return transactions.map((t) => ({
    date: t.date,
    merchant: t.merchant,
    account: `${t.bank} ••${t.last4}`,
    category: t.category,
    amount: t.amountPaise / 100,
  }));
}

// Deletes the account and everything in it (needs the password + card steps), then forgets the session.
export async function deleteUserData() {
  const result = await request('/api/data', { method: 'DELETE' });
  clearToken();
  return result;
}

// ---------- data screens ----------

// Tells "no statements uploaded yet" from "uploaded, but not enough for this screen".
async function notReady(message) {
  const { hasData } = await request('/api/session');
  return hasData ? { __state: 'insufficient', messages: [message] } : { __state: 'empty' };
}

// Home: everything the Home page shows, shaped by homeView.js.
export async function getHome() {
  const d = await request('/api/dashboard');
  if (d.insufficientHistory) return notReady('Home needs at least one complete month of statements.');
  const [trends, flags] = await Promise.all([request('/api/trends'), request('/api/flags')]);
  return toHome(d, trends, flags);
}

export async function getStatements() {
  return toStatements(await request('/api/statements'));
}

// One file per call. Rejects with the server's reason (e.g. "Unrecognised CSV format...").
export async function uploadStatement(file) {
  const form = new FormData();
  form.append('file', file);
  const result = await request('/api/upload', { method: 'POST', body: form });
  invalidate();
  return result;
}

export async function deleteStatement(id) {
  await request(`/api/statements/${id}`, { method: 'DELETE' });
  invalidate();
}

// Loads the planted demo dataset for the signed-in user only. If they already have statements the server refuses
// (error code HAS_STATEMENTS) unless replace is true, which clears their statements first.
export async function loadDemoData({ replace = false, set = 'eight_months_complete' } = {}) {
  const result = await request(`/api/demo-data?set=${set}&replace=${replace}`, { method: 'POST' });
  invalidate();
  return result;
}

export const getCategories = () => request('/api/categories');

// Up to 500 rows; the screen filters them locally.
export async function getTransactions() {
  const [list, categories, session, flags] = await Promise.all([
    request('/api/transactions?limit=500'), getCategories(), request('/api/session'), request('/api/flags'),
  ]);
  if (!session.hasData) return { __state: 'empty' };
  return toTransactions(list, categories, flags.openCount);
}

// Change one transaction's category, and by default every transaction of the same merchant. Returns { batchId, changed }.
export async function correctCategory(transactionId, categoryId, applyToMerchant) {
  const result = await request(`/api/transactions/${transactionId}/category`, { method: 'POST', body: { categoryId, applyToMerchant } });
  invalidate();
  return result;
}

export async function undoCorrection(batchId) {
  await request(`/api/corrections/${batchId}/undo`, { method: 'POST' });
  invalidate();
}

export async function getFlags() {
  const [f, session] = await Promise.all([request('/api/flags'), request('/api/session')]);
  if (!session.hasData) return { __state: 'empty' };
  return toFlags(f);
}

// decision: 'confirmed' (it is a duplicate) or 'dismissed' (fine as it is)
export async function decideFlag(flagId, decision) {
  await request(`/api/flags/${flagId}/decision`, { method: 'POST', body: { decision } });
  invalidate();
}

export async function getTrends() {
  const [t, session] = await Promise.all([request('/api/trends'), request('/api/session')]);
  if (t.insufficientHistory) return notReady('Trends compare each month with your previous three, so they start after 4 complete months of statements.');
  return toTrends(t, await request('/api/surplus-plan'), session.accounts);
}

// compare: 'avg3' (3-month median) or 'prev' (last month). category: a category name to open in the drawer.
export async function getMoneyFlow(month, compare, topN, category) {
  const cmp = compare === 'prev' ? 'prev' : 'median';
  const query = new URLSearchParams({ compare: cmp, top_n: topN });
  if (month) query.set('month', month);
  if (category) query.set('category', category);
  const f = await request(`/api/money-flow?${query}`);
  if (f.insufficientHistory && !f.nodes.length) return notReady('Money Flow needs at least one complete month of statements.');
  return toMoneyFlow(f, cmp);
}

// Ask, step 0: suggestions sized to the user's surplus, and their banks.
export async function getAskSetup() {
  const [d, s] = await Promise.all([request('/api/dashboard'), request('/api/session')]);
  if (d.insufficientHistory) return notReady('Questions are answered from your statements, which need at least one complete month.');
  const { defaultQuestion, quickQuestions } = suggestions(d.planningSurplusPaise);
  return { presets: [defaultQuestion, ...quickQuestions], accounts: [...new Set(s.accountList.map((a) => a.bank))], asOf: d.asOf };
}

// Ask, step 1: what we understood from the sentence (amount, month, and what is missing). Nothing is calculated yet.
export async function parseQuestion(question) {
  return (await request('/api/ask', { method: 'POST', body: { question } })).parsed;
}

// Ask, step 2: the answer for the amount and month the user confirmed (amount in rupees, month as 2026-12).
export async function askAnswer(amountRupees, targetMonth) {
  const body = { amountPaise: Math.round(amountRupees * 100), targetMonth };
  const [answer, recurring] = await Promise.all([request('/api/ask', { method: 'POST', body }), request('/api/recurring')]);
  if (answer.status === 'insufficient_data') return { insufficient: true, safeguards: toSafeguards(answer.missing) };
  return { raw: answer, recurring: recurring.items };
}

// ---------- goals, surplus plan, track record ----------

export async function getGoals() {
  const [g, plan] = await Promise.all([request('/api/goals'), request('/api/surplus-plan')]);
  if (plan.insufficientHistory) return notReady('Goals are checked against your surplus, which needs at least one complete month of statements.');
  setGoalBase(g.asOf);
  return toGoals(g, plan);
}

// values: { id?, name, target, saved, monthsLeft, category, priority } in rupees and months from the latest statement.
export async function saveGoal(values, asOf) {
  const body = {
    name: values.name, targetPaise: Math.round(values.target * 100), savedPaise: Math.round(values.saved * 100),
    targetDate: goalDate(asOf, values.monthsLeft), category: values.category, priority: values.priority,
  };
  await request(values.id ? `/api/goals/${values.id}` : '/api/goals', { method: values.id ? 'PUT' : 'POST', body });
  invalidate();
}

export async function getSurplusPlan() {
  const plan = await request('/api/surplus-plan');
  if (plan.insufficientHistory) return notReady('The surplus plan needs at least one complete month of statements.');
  return toSurplusPlan(plan);
}

// The first visit builds the track record by forecasting each past month from earlier data only (safe to repeat).
export async function getTrackRecord() {
  if (!(await request('/api/session')).hasData) return { __state: 'empty' };
  let tr = await request('/api/track-record');
  if (!tr.months.length) {
    const built = await request('/api/track-record/backtest', { method: 'POST' });
    tr = await request('/api/track-record');
    if (!tr.months.length) {
      const reasons = [...new Set(built.skipped.map((x) => `${monthLabel(x.month)}: ${x.reason}`))];
      return { __state: 'insufficient', messages: reasons.slice(0, 3) };
    }
  }
  const [log, verify, accuracy] = await Promise.all([request('/api/forecast-log'), request('/api/forecast-log/verify'), request('/api/categorisation-accuracy')]);
  return toTrackRecord(tr, log.entries, verify, accuracy);
}

export const verifyLedger = () => request('/api/forecast-log/verify');

// ---------- landing page ----------


// ---- Suggestions for you (Plan). The server builds the anonymous profile itself; the browser never sends money data. ----
export const getSuggestionsAbout = () => request('/api/suggestions/about');
export const saveSuggestionsAbout = (answers) => request('/api/suggestions/about', { method: 'PUT', body: answers });
export const getSuggestions = (refresh = false) => request('/api/suggestions', { method: 'POST', body: { refresh } });

// ---- Cash wallet: cash the bank statements cannot show. Amounts here are paise, like the rest of the API. ----
export const getCash = () => request('/api/cash');

async function changeCash(path, options) {
  const result = await request(path, options);
  invalidate(); // totals, trends and the forecast all include cash
  return result;
}

// entry: { type: 'spent' | 'received', amountPaise, category | sourceType, date, note }
export const addCash = (entry) => changeCash('/api/cash', { method: 'POST', body: entry });
export const updateCash = (id, changes) => changeCash(`/api/cash/${id}`, { method: 'PATCH', body: changes });
export const deleteCash = (id) => changeCash(`/api/cash/${id}`, { method: 'DELETE' });
export const splitWithdrawal = (withdrawalId, parts) => changeCash('/api/cash/split-withdrawal', { method: 'POST', body: { withdrawalId, parts } });
