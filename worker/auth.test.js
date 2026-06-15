import assert from 'node:assert/strict';
import test from 'node:test';
import { hasPortalAccess } from './auth.js';

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
