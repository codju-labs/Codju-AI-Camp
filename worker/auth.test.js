import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import { completeDemoAuth, getSession, hasPortalAccess } from './auth.js';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

function createPaymentsDb(rows = {}) {
  return {
    prepare(sql) {
      return {
        bind(email) {
          return {
            async first() {
              if (sql.includes('payment_orders')) return rows.paid?.[email] || null;
              if (sql.includes('portal_access')) return rows.linked?.[email] || null;
              return null;
            },
          };
        },
      };
    },
  };
}

test('test emails receive portal access', async () => {
  const access = await hasPortalAccess({
    ACCESS_TEST_EMAILS: 'devashishpuri@gmail.com, test@example.com',
    PAYMENTS: createPaymentsDb(),
  }, ' Test@Example.com ');

  assert.equal(access, true);
});

test('demo email receives portal access when configured', async () => {
  const access = await hasPortalAccess({
    DEMO_LOGIN_EMAIL: 'demo@example.com',
    PAYMENTS: createPaymentsDb(),
  }, ' Demo@Example.com ');

  assert.equal(access, true);
});

test('successful payment emails receive portal access', async () => {
  const access = await hasPortalAccess({
    PAYMENTS: createPaymentsDb({
      paid: { 'parent@example.com': { order_id: 'order_1' } },
    }),
  }, 'parent@example.com');

  assert.equal(access, true);
});

test('support-linked student emails receive portal access', async () => {
  const access = await hasPortalAccess({
    PAYMENTS: createPaymentsDb({
      linked: { 'student@example.com': { email: 'student@example.com' } },
    }),
  }, 'student@example.com');

  assert.equal(access, true);
});

test('unknown emails are denied portal access', async () => {
  const access = await hasPortalAccess({
    PAYMENTS: createPaymentsDb(),
  }, 'unknown@example.com');

  assert.equal(access, false);
});

test('demo credentials create a normal signed session', async () => {
  const env = {
    AUTH_SECRET: 'test-auth-secret',
    PUBLIC_SITE_URL: 'https://summercamp.codju.com',
    DEMO_LOGIN_USERNAME: 'demo',
    DEMO_LOGIN_PASSWORD: 'pass123',
    DEMO_LOGIN_EMAIL: 'demo@example.com',
    DEMO_LOGIN_NAME: 'Demo Student',
  };
  const request = new Request('https://summercamp.codju.com/api/auth/demo', {
    method: 'POST',
    body: new URLSearchParams({ username: 'demo', password: 'pass123' }),
  });

  const response = await completeDemoAuth(request, env);
  const cookie = response.headers.get('Set-Cookie');
  const sessionCookie = cookie.match(/codju_aicc_session=([^;]+)/)?.[1];
  const sessionRequest = new Request('https://summercamp.codju.com/api/auth/me', {
    headers: { Cookie: `codju_aicc_session=${sessionCookie}` },
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://summercamp.codju.com/learn');
  assert.ok(sessionCookie);
  assert.deepEqual(await getSession(sessionRequest, env), {
    email: 'demo@example.com',
    name: 'Demo Student',
    image: null,
  });
});

test('demo credentials reject invalid passwords', async () => {
  const env = {
    AUTH_SECRET: 'test-auth-secret',
    PUBLIC_SITE_URL: 'https://summercamp.codju.com',
    DEMO_LOGIN_USERNAME: 'demo',
    DEMO_LOGIN_PASSWORD: 'pass123',
    DEMO_LOGIN_EMAIL: 'demo@example.com',
  };
  const request = new Request('https://summercamp.codju.com/api/auth/demo', {
    method: 'POST',
    body: new URLSearchParams({ username: 'demo', password: 'wrong' }),
  });

  const response = await completeDemoAuth(request, env);

  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get('Location'),
    'https://summercamp.codju.com/sign-in?error=demo_failed',
  );
  assert.equal(response.headers.has('Set-Cookie'), false);
});
