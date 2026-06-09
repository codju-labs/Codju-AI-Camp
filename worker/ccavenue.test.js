import assert from 'node:assert/strict';
import test from 'node:test';
import { decrypt, encrypt } from './ccavenue.js';

test('CCAvenue payload encryption round-trips', () => {
  const payload = 'merchant_id=12345&order_id=CODJU-1&currency=INR&amount=999.00';
  const workingKey = '0123456789abcdef0123456789abcdef';
  const encrypted = encrypt(payload, workingKey);

  assert.match(encrypted, /^[a-f0-9]+$/);
  assert.equal(decrypt(encrypted, workingKey), payload);
});
