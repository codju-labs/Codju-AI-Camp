import assert from 'node:assert/strict';
import { createHmac, webcrypto } from 'node:crypto';
import test from 'node:test';
import { decrypt, encrypt } from './ccavenue.js';
import worker from './index.js';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

function createD1Stub() {
  return {
    prepare() {
      return {
        bind() {
          return {
            async run() {
              return { meta: { changes: 1 } };
            },
            async first() {
              return null;
            },
          };
        },
      };
    },
  };
}

const AUTH_SECRET = 'test-auth-secret';

function createSessionCookie(email) {
  const payload = Buffer.from(JSON.stringify({
    email,
    name: 'Test Student',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');
  return `codju_aicc_session=${payload}.${signature}`;
}

async function withMockedNow(value, callback) {
  const RealDate = globalThis.Date;
  const fixedTime = new RealDate(value).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...args) {
      return args.length ? new RealDate(...args) : new RealDate(fixedTime);
    }

    static now() {
      return fixedTime;
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }

    static parse(...args) {
      return RealDate.parse(...args);
    }
  };

  try {
    return await callback();
  } finally {
    globalThis.Date = RealDate;
  }
}

const env = {
  REGISTRATION_STATUS: 'open',
  RAZORPAY_KEY_ID: 'rzp_test_example',
  RAZORPAY_KEY_SECRET: 'razorpay-test-secret',
  CCAVENUE_ENVIRONMENT: 'test',
  CCAVENUE_MERCHANT_ID: 'test-merchant',
  CCAVENUE_ACCESS_CODE: 'test-access',
  CCAVENUE_WORKING_KEY: '0123456789abcdef0123456789abcdef',
  CAMP_PRICE_INR: '2999.00',
  GST_RATE_PERCENT: '18',
  PUBLIC_SITE_URL: 'https://camp.example.com',
  AUTH_SECRET,
  ACCESS_TEST_EMAILS: 'student@example.com,rkbish@gmail.com,devashishpuri@gmail.com',
  EMAILOCTOPUS_API_KEY: 'email-api-key',
  EMAILOCTOPUS_LIST_ID: 'list-id',
  EMAILOCTOPUS_AUTOMATION_ID: 'automation-id',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'worker@example.iam.gserviceaccount.com',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'private-key',
  GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet-id',
  PAYMENTS: createD1Stub(),
  ASSETS: {
    fetch: () => new Response('asset'),
  },
};

test('Razorpay order creation uses the server-calculated amount', async () => {
  const originalFetch = globalThis.fetch;
  const storedOrders = [];
  const payments = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              if (sql.includes('INSERT INTO payment_orders')) {
                storedOrders.push(values);
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };

  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.amount, 299900);
    assert.equal(body.currency, 'INR');
    return Response.json({
      id: 'order_razorpay_test',
      amount: body.amount,
      currency: body.currency,
    });
  };

  try {
    const response = await worker.fetch(
      new Request('https://camp.example.com/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://camp.example.com',
        },
        body: JSON.stringify({
          parent_name: 'Test Parent',
          student_name: 'Test Student',
          email: 'test@example.com',
          phone: '9876543210',
          amount: 100,
        }),
      }),
      { ...env, PAYMENTS: payments },
      { waitUntil() {} },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      order_id: 'order_razorpay_test',
      amount: 299900,
      currency: 'INR',
      key_id: env.RAZORPAY_KEY_ID,
    });
    assert.equal(storedOrders.length, 1);
    assert.equal(storedOrders[0][0], 'order_razorpay_test');
    assert.equal(storedOrders[0][1], '2541.53');
    assert.equal(storedOrders[0][2], '457.47');
    assert.equal(storedOrders[0][4], '2999.00');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Razorpay authentication failures return 401', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { error: { code: 'BAD_REQUEST_ERROR' } },
    { status: 401 },
  );

  try {
    const response = await worker.fetch(
      new Request('https://camp.example.com/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_name: 'Test Parent',
          student_name: 'Test Student',
          email: 'test@example.com',
          phone: '9876543210',
        }),
      }),
      env,
      { waitUntil() {} },
    );

    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /authentication failed/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Day 3 lessons are available early for full-access students', async () => {
  const response = await withMockedNow('2026-06-23T12:00:00+05:30', () =>
    worker.fetch(
      new Request('https://camp.example.com/learn/lesson/aicc-learn-notes', {
        headers: { Cookie: createSessionCookie('rkbish@gmail.com') },
      }),
      env,
      { waitUntil() {} },
    ));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset');
});

test('Day 3 lessons redirect regular students before the unlock date', async () => {
  const response = await withMockedNow('2026-06-23T12:00:00+05:30', () =>
    worker.fetch(
      new Request('https://camp.example.com/learn/lesson/aicc-learn-notes', {
        headers: { Cookie: createSessionCookie('student@example.com') },
        redirect: 'manual',
      }),
      env,
      { waitUntil() {} },
    ));

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://camp.example.com/learn');
});

test('Day 4 lessons redirect regular students before the unlock date', async () => {
  const response = await withMockedNow('2026-06-24T12:00:00+05:30', () =>
    worker.fetch(
      new Request('https://camp.example.com/learn/lesson/aicc-meet-dpaa', {
        headers: { Cookie: createSessionCookie('student@example.com') },
        redirect: 'manual',
      }),
      env,
      { waitUntil() {} },
    ));

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://camp.example.com/learn');
});

test('Day 5 lessons are available early for full-access students', async () => {
  const response = await withMockedNow('2026-06-24T12:00:00+05:30', () =>
    worker.fetch(
      new Request('https://camp.example.com/learn/lesson/aicc-web-project', {
        headers: { Cookie: createSessionCookie('devashishpuri@gmail.com') },
      }),
      env,
      { waitUntil() {} },
    ));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset');
});

test('Day 6 game lessons redirect regular students before the unlock date', async () => {
  const response = await withMockedNow('2026-06-26T12:00:00+05:30', () =>
    worker.fetch(
      new Request('https://camp.example.com/learn/lesson/aicc-game-build', {
        headers: { Cookie: createSessionCookie('student@example.com') },
        redirect: 'manual',
      }),
      env,
      { waitUntil() {} },
    ));

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://camp.example.com/learn');
});

test('Razorpay verification accepts a valid signature and marks the order paid', async () => {
  const order = {
    order_id: 'order_valid_signature',
    enrollment_id: null,
    status: 'Initiated',
    fulfillment_status: 'Pending',
    email_status: 'Pending',
    sheet_status: 'Pending',
  };
  const backgroundTasks = [];
  const payments = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              return { ...order };
            },
            run() {
              if (sql.includes("payment_mode = 'Razorpay'")) {
                order.status = 'Success';
                order.tracking_id = values[0];
                return Promise.resolve({ meta: { changes: 1 } });
              }
              if (sql.includes('enrollment_id = ?')) {
                order.enrollment_id = values[0];
                return Promise.resolve({ meta: { changes: 1 } });
              }
              if (sql.includes("SET fulfillment_status = 'Processing'")) {
                return new Promise(() => {});
              }
              return Promise.resolve({ meta: { changes: 1 } });
            },
          };
        },
      };
    },
  };
  const paymentId = 'pay_valid_signature';
  const signature = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${order.order_id}|${paymentId}`)
    .digest('hex');

  const response = await worker.fetch(
    new Request('https://camp.example.com/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: order.order_id,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    }),
    { ...env, PAYMENTS: payments },
    { waitUntil: (promise) => backgroundTasks.push(promise) },
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.match(result.enrollment_id, /AICC-2026-[A-F0-9]{10}/);
  assert.equal(order.status, 'Success');
  assert.equal(order.tracking_id, paymentId);
  assert.equal(backgroundTasks.length, 1);
});

test('Razorpay verification rejects an invalid signature without marking paid', async () => {
  const order = {
    order_id: 'order_invalid_signature',
    enrollment_id: null,
    status: 'Initiated',
    fulfillment_status: 'Pending',
  };
  const payments = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return { ...order };
            },
            async run() {
              throw new Error('Invalid signatures must not update the order.');
            },
          };
        },
      };
    },
  };

  const response = await worker.fetch(
    new Request('https://camp.example.com/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: order.order_id,
        razorpay_payment_id: 'pay_invalid_signature',
        razorpay_signature: '0'.repeat(64),
      }),
    }),
    { ...env, PAYMENTS: payments },
    { waitUntil() {} },
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /signature verification failed/i);
  assert.equal(order.status, 'Initiated');
});

test('legacy CCAvenue payment initiation is retired', async () => {
  const response = await worker.fetch(
    new Request('https://camp.example.com/api/payments/initiate', {
      method: 'POST',
    }),
    env,
  );

  assert.equal(response.status, 410);
  assert.match((await response.json()).error, /retired/i);
});

test('payment quote returns the server-calculated GST breakdown', async () => {
  const response = await worker.fetch(
    new Request('https://camp.example.com/api/payments/quote'),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    base: '2541.53',
    gst: '457.47',
    gstRate: 18,
    total: '2999.00',
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

test('successful callbacks return before background fulfillment completes', async () => {
  const order = {
    order_id: 'CODJU-1781000000000-ABC12345',
    enrollment_id: null,
    amount: '2999.00',
    status: 'Initiated',
    fulfillment_status: 'Pending',
    email_status: 'Pending',
    sheet_status: 'Pending',
  };
  const backgroundTasks = [];
  const payments = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              return { ...order };
            },
            run() {
              if (sql.includes("SET status = ?")) {
                order.status = values[0];
                return Promise.resolve({ meta: { changes: 1 } });
              }
              if (sql.includes('enrollment_id = ?')) {
                order.enrollment_id = values[0];
                return Promise.resolve({ meta: { changes: 1 } });
              }
              if (sql.includes("SET fulfillment_status = 'Processing'")) {
                return new Promise(() => {});
              }
              return Promise.resolve({ meta: { changes: 1 } });
            },
          };
        },
      };
    },
  };
  const payment = new URLSearchParams({
    merchant_id: env.CCAVENUE_MERCHANT_ID,
    order_id: order.order_id,
    currency: 'INR',
    amount: order.amount,
    order_status: 'Success',
    tracking_id: 'TRACK-123',
  });
  const request = new Request(
    'https://camp.example.com/api/payments/callback',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        encResp: encrypt(payment.toString(), env.CCAVENUE_WORKING_KEY),
      }),
    },
  );

  const response = await worker.fetch(
    request,
    {
      ...env,
      CAMP_PRICE_INR: '2999.00',
      PAYMENTS: payments,
    },
    { waitUntil: (promise) => backgroundTasks.push(promise) },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Enrollment confirmed/);
  assert.match(html, /AICC-2026-[A-F0-9]{10}/);
  assert.equal(backgroundTasks.length, 1);
});
