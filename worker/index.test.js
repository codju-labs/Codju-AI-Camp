import assert from 'node:assert/strict';
import test from 'node:test';
import { decrypt } from './ccavenue.js';
import worker from './index.js';

const env = {
  CCAVENUE_ENVIRONMENT: 'test',
  CCAVENUE_MERCHANT_ID: 'test-merchant',
  CCAVENUE_ACCESS_CODE: 'test-access',
  CCAVENUE_WORKING_KEY: '0123456789abcdef0123456789abcdef',
  CAMP_PRICE_INR: '1999.00',
  GST_RATE_PERCENT: '18',
  PUBLIC_SITE_URL: 'https://camp.example.com',
  ASSETS: {
    fetch: () => new Response('asset'),
  },
};

test('payment initiation uses the server-configured amount', async () => {
  const form = new URLSearchParams({
    parent_name: 'Test Parent',
    student_name: 'Test Student',
    email: 'test@example.com',
    phone: '9876543210',
    amount: '1.00',
  });
  const request = new Request(
    'https://camp.example.com/api/payments/initiate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://camp.example.com',
      },
      body: form,
    },
  );

  const response = await worker.fetch(request, env);
  const html = await response.text();
  const encryptedRequest = html.match(
    /name="encRequest" value="([a-f0-9]+)"/,
  )?.[1];

  assert.equal(response.status, 200);
  assert.match(
    html,
    /https:\/\/test\.ccavenue\.com\/transaction\/transaction\.do/,
  );
  assert.match(html, /<script src="\/payment\/submit\.js"><\/script>/);
  assert.match(
    response.headers.get('Content-Security-Policy'),
    /script-src 'self'/,
  );
  assert.match(
    response.headers.get('Content-Security-Policy'),
    /connect-src 'self'/,
  );
  assert.ok(encryptedRequest);

  const payment = new URLSearchParams(
    decrypt(encryptedRequest, env.CCAVENUE_WORKING_KEY),
  );
  assert.equal(payment.get('amount'), '2358.82');
  assert.equal(payment.get('merchant_param3'), '1999.00');
  assert.equal(payment.get('merchant_param4'), '359.82');
  assert.equal(payment.get('merchant_param5'), '18');
  assert.equal(payment.has('merchant_param2'), false);
  assert.equal(payment.get('merchant_id'), env.CCAVENUE_MERCHANT_ID);
  assert.equal(
    payment.get('redirect_url'),
    'https://camp.example.com/api/payments/callback',
  );
});

test('payment quote returns the server-calculated GST breakdown', async () => {
  const response = await worker.fetch(
    new Request('https://camp.example.com/api/payments/quote'),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    base: '1999.00',
    gst: '359.82',
    gstRate: 18,
    total: '2358.82',
  });
});

test('payment submit script is served as external JavaScript', async () => {
  const response = await worker.fetch(
    new Request('https://camp.example.com/payment/submit.js'),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('Content-Type'),
    'text/javascript; charset=UTF-8',
  );
  assert.match(await response.text(), /ccavenue-form/);
});

test('invalid payment callbacks are rejected', async () => {
  const request = new Request(
    'https://camp.example.com/api/payments/callback',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ encResp: 'not-valid' }),
    },
  );

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 400);
});
