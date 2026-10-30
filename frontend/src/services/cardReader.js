// Mock RFID/NFC card reader. Replace the bodies with the real reader SDK (WebUSB / Web NFC / backend bridge) later.
// Both functions wait like a real "tap", then resolve or reject with an error whose `code` the UI understands:
//   ALREADY_LINKED  - card belongs to another account
//   READER_MISSING  - no reader connected
//   MISMATCH        - tapped card is not the registered one

const TAP_DELAY_MS = 1500;
const REGISTERED_CARD = { uid: '04:A2:19:4F:2A', last4: '4F2A' };

function cardError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// simulate: optional forced outcome for demos ('success' | 'ALREADY_LINKED' | 'READER_MISSING').
export function registerCard({ simulate = 'success' } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simulate === 'ALREADY_LINKED') reject(cardError('ALREADY_LINKED', 'This NFC UID is registered to another primary account'));
      else if (simulate === 'READER_MISSING') reject(cardError('READER_MISSING', 'Connect reader via USB port or pair via BLE'));
      else resolve({ ...REGISTERED_CARD, registeredAt: new Date().toISOString() });
    }, TAP_DELAY_MS);
  });
}

// simulate: optional forced outcome ('success' | 'MISMATCH' | 'READER_MISSING').
export function verifyCard({ simulate = 'success' } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simulate === 'MISMATCH') reject(cardError('MISMATCH', 'Tapped card does not match the registered card'));
      else if (simulate === 'READER_MISSING') reject(cardError('READER_MISSING', 'Connect reader via USB port or pair via BLE'));
      else resolve({ verified: true, last4: REGISTERED_CARD.last4 });
    }, TAP_DELAY_MS);
  });
}
