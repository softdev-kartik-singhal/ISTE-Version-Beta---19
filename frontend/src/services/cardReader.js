// NFC card reader, talking to the backend. The card is read by the ESP32 over Wi-Fi, not by the browser:
// the browser opens a "wait for a tap" request, the ESP32 posts the card UID, and the browser polls for the result.
// Both functions resolve or reject with an error whose `code` the UI understands:
//   ALREADY_LINKED  - card belongs to another account
//   READER_MISSING  - nothing was tapped in time, or the server cannot be reached
//   MISMATCH        - tapped card is not the registered one
//   CARD_EXISTS     - this account already has a card and replacing it was not confirmed
import { request } from './api';
import { USE_MOCK_CARD_READER } from '../config';

const POLL_MS = 1000;
const TIMEOUT_MS = 60_000; // matches the server's tap window
const FORCED_ERRORS = { ALREADY_LINKED: 'This NFC UID is registered to another primary account', READER_MISSING: 'No card tap reached SmartGullak. Is the card reader connected?', MISMATCH: 'Tapped card does not match the registered card' };
// What the server calls a failure -> what the UI calls it.
const CODE_MAP = { TIMEOUT: 'READER_MISSING', NETWORK: 'READER_MISSING', SUPERSEDED: 'CANCELLED' };
const MESSAGES = { ...FORCED_ERRORS, CARD_EXISTS: 'This account already has a card.', CANCELLED: 'Cancelled by a newer scan.' };

function cardError(code, message) {
  const err = new Error(message || MESSAGES[code] || 'Card error');
  err.code = code;
  err.isCardError = true; // already translated; do not wrap it again
  return err;
}

// Turns a failed request into a card error the UI can show.
function asCardError(err) {
  const code = CODE_MAP[err.code] || err.code || 'READER_MISSING';
  return cardError(code, MESSAGES[code] || err.message);
}

// Polls until the ESP32 has reported the tap (or the window closes).
async function waitForTap(requestId) {
  const deadline = Date.now() + TIMEOUT_MS + 2000;
  while (Date.now() < deadline) {
    const status = await request(`/api/card/requests/${requestId}`);
    if (status.status === 'done') return status;
    if (status.status === 'failed') throw cardError(CODE_MAP[status.errorCode] || status.errorCode);
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw cardError('READER_MISSING');
}

// Simulated reader (USE_MOCK_CARD_READER in config.js): waits like a real tap, then succeeds or fails as asked.
function simulated(result, simulate) {
  return new Promise((resolve, reject) => setTimeout(() => (FORCED_ERRORS[simulate] ? reject(cardError(simulate)) : resolve(result)), 1500));
}

// Registers a card. If the account already has one this swaps it (the server then requires the password + current card
// to have been verified in the last 60 seconds). simulate: optional forced error for the demo sandbox.
export async function registerCard({ simulate } = {}) {
  if (USE_MOCK_CARD_READER) return simulated({ last4: '4F2A', registeredAt: new Date().toISOString() }, simulate);
  try {
    const { registered } = await request('/api/card');
    const { requestId } = await request('/api/card/register/start', { method: 'POST', body: { replace: registered } });
    const done = await waitForTap(requestId);
    return { last4: done.last4, registeredAt: new Date().toISOString() };
  } catch (err) {
    throw err.isCardError ? err : asCardError(err);
  }
}

// Waits for the registered card to be tapped. simulate: optional forced error for the demo sandbox.
export async function verifyCard({ simulate } = {}) {
  if (USE_MOCK_CARD_READER) return simulated({ verified: true, last4: '4F2A' }, simulate);
  try {
    const { requestId } = await request('/api/card/verify/start', { method: 'POST' });
    const done = await waitForTap(requestId);
    return { verified: true, last4: done.last4 };
  } catch (err) {
    throw err.isCardError ? err : asCardError(err);
  }
}
