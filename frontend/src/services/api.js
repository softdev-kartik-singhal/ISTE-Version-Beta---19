// Data access layer. Every function returns mock data today; swap the bodies for fetch() calls to the FastAPI backend later.
import * as mock from '../data/mock';
import { evaluateQuestion } from './affordability';

// Simulates a network round-trip so pages already handle async data.
function respond(data) {
  return new Promise((resolve) => setTimeout(() => resolve(data), 50));
}

// Mock auth: accepts the demo account's password, rejects anything else.
export function login(email, password) {
  const ok = email.trim().toLowerCase() === mock.auth.email && password === mock.auth.password;
  return new Promise((resolve, reject) =>
    setTimeout(() => (ok ? resolve(mock.session) : reject(new Error('Email or master password is incorrect.'))), 600),
  );
}

// Pre-fill values for the Log In form (demo only; return empty strings once real auth exists).
export function demoCredentials() {
  return { email: mock.auth.email, password: mock.auth.password };
}

export function signup({ name, email }) {
  return respond({ ...mock.session, user: { ...mock.session.user, name: name || mock.session.user.name, email } });
}

export function requestPasswordReset(email) {
  return respond({ sentTo: email });
}

export function getSession() {
  return respond(mock.session);
}

export function getLanding() {
  return respond(mock.landing);
}

export function getDashboard() {
  return respond(mock.dashboard);
}

export function askQuestion(question, options) {
  return respond(evaluateQuestion(mock.ask, question || mock.ask.question, options));
}

export function getTrends() {
  return respond(mock.trends);
}

// Keeps only the topN merchants (by amount) and compares the selected category against the chosen baseline.
export function getMoneyFlow(month, compare, topN) {
  const flow = mock.moneyFlow;
  const merchants = flow.nodes.filter((n) => n.column === 3).sort((a, b) => b.amount - a.amount);
  const kept = new Set(merchants.slice(0, topN).map((n) => n.id));
  const nodes = flow.nodes.filter((n) => n.column !== 3 || kept.has(n.id));
  const links = flow.links.filter((l) => nodes.some((n) => n.id === l.to));

  const detail = flow.selectedCategory;
  const months = detail.trajectory.months;
  const baseline = compare === 'prev' ? months[months.length - 2].value : detail.median;
  const change = Math.round((detail.amount / baseline - 1) * 100);
  const selectedCategory = {
    ...detail,
    change: `+${change}% ${compare === 'prev' ? 'vs Sep' : 'vs 3-mo med'}`,
    compareLabel: compare === 'prev' ? 'Oct vs Sep' : 'Oct vs 3-mo avg',
  };

  return respond({ ...flow, nodes, links, selectedCategory, month, compare, topN });
}

export function getGoals() {
  return respond(mock.goals);
}

export function getSurplusPlan() {
  return respond(mock.surplusPlan);
}

export function getStatements() {
  return respond(mock.statements);
}

export function getTransactions() {
  return respond(mock.transactions);
}

export function getFlags() {
  return respond(mock.flags);
}

export function getTrackRecord() {
  return respond(mock.trackRecord);
}

export function getPrivacy() {
  return respond(mock.privacy);
}

// Step 1 of a sensitive action: check the master password (mock: the demo account's password).
export function verifyPassword(password) {
  return new Promise((resolve, reject) =>
    setTimeout(() => (password === mock.auth.password ? resolve(true) : reject(new Error('Incorrect master password.'))), 400),
  );
}

// Rows for the "Export my data" CSV.
export function exportUserData() {
  return respond(
    mock.transactions.transactions.map((tx) => ({
      date: tx.date,
      merchant: tx.merchant,
      account: `${tx.bank} ••${tx.last4}`,
      category: tx.category,
      amount: tx.amount,
    })),
  );
}

export function deleteUserData() {
  return respond({ deleted: true });
}
