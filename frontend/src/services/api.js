// Data access layer. Every function returns mock data today; swap the bodies for fetch() calls to the FastAPI backend later.
import * as mock from '../data/mock';

// Simulates a network round-trip so pages already handle async data.
function respond(data) {
  return new Promise((resolve) => setTimeout(() => resolve(data), 50));
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

export function askQuestion(question) {
  return respond({ ...mock.ask, question: question || mock.ask.question });
}

export function getTrends() {
  return respond(mock.trends);
}

export function getMoneyFlow(month, compare, topN) {
  return respond({ ...mock.moneyFlow, month, compare, topN });
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
