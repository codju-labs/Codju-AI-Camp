import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import {
  appendEnrollmentSheet,
  createEnrollmentId,
  sendEnrollmentEmail,
} from './fulfillment.js';

const order = {
  enrollment_id: 'AICC-2026-ABC123',
  order_id: 'CODJU-123',
  tracking_id: 'TRACK-456',
  parent_name: 'Test Parent',
  student_name: 'Test Student',
  email: 'test@example.com',
  phone: '9876543210',
  base_amount: '1999.00',
  gst_amount: '359.82',
  gst_rate: '18',
  amount: '2358.82',
  currency: 'INR',
  payment_mode: 'Credit Card',
  bank_ref_no: 'BANK-1',
  status: 'Success',
  created_at: '2026-06-09 12:00:00',
};

test('enrollment IDs are deterministic', () => {
  assert.equal(createEnrollmentId('CODJU-123'), createEnrollmentId('CODJU-123'));
  assert.match(createEnrollmentId('CODJU-123'), /^AICC-\d{4}-[A-F0-9]{10}$/);
});

test('EmailOctopus creates a contact and queues the automation', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options });
    if (requests.length === 1) return new Response('{}', { status: 404 });
    if (requests.length === 2) {
      return Response.json({ id: 'contact-1', email_address: order.email });
    }
    return Response.json({});
  };

  const result = await sendEnrollmentEmail(order, {
    EMAILOCTOPUS_API_KEY: 'api-key',
    EMAILOCTOPUS_LIST_ID: 'list-id',
    EMAILOCTOPUS_AUTOMATION_ID: 'automation-id',
  }, fetchImpl);

  assert.equal(result.contactId, 'contact-1');
  assert.equal(requests.length, 3);
  assert.match(requests[2].url, /automations\/automation-id\/queue/);
});

test('EmailOctopus explains automation authorization failures', async () => {
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    if (requests === 1) return new Response('{}', { status: 404 });
    if (requests === 2) return Response.json({ id: 'contact-1' });
    return Response.json({
      error: {
        code: 'UNAUTHORISED',
        message: "You're not authorised to perform that action.",
      },
    }, { status: 403 });
  };

  await assert.rejects(
    sendEnrollmentEmail(order, {
      EMAILOCTOPUS_API_KEY: 'api-key',
      EMAILOCTOPUS_LIST_ID: 'list-id',
      EMAILOCTOPUS_AUTOMATION_ID: 'automation-id',
    }, fetchImpl),
    /Started via API/,
  );
});

test('Google Sheets receives an enrollment row', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options });
    if (requests.length === 1) {
      return Response.json({ access_token: 'google-token' });
    }
    if (requests.length === 2) return Response.json({ values: [['Enrollment ID']] });
    return Response.json({ updates: { updatedRange: 'Enrollments!A2:Q2' } });
  };

  const result = await appendEnrollmentSheet(order, {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'worker@example.iam.gserviceaccount.com',
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }),
    GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet-id',
    GOOGLE_SHEETS_RANGE: 'Enrollments!A:Q',
  }, fetchImpl);

  assert.equal(result.updatedRange, 'Enrollments!A2:Q2');
  assert.match(requests[2].url, /sheets\.googleapis\.com/);
  const sheetBody = JSON.parse(requests[2].options.body);
  assert.equal(sheetBody.values[0][0], order.enrollment_id);
  assert.equal(sheetBody.values[0][4], order.student_name);
});

test('Google Sheets skips an enrollment that already exists', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    if (requests === 1) return Response.json({ access_token: 'google-token' });
    return Response.json({ values: [['Enrollment ID'], [order.enrollment_id]] });
  };

  const result = await appendEnrollmentSheet(order, {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'worker@example.iam.gserviceaccount.com',
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }),
    GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet-id',
    GOOGLE_SHEETS_RANGE: 'Enrollments!A:Q',
  }, fetchImpl);

  assert.equal(result.updatedRange, 'Enrollments!A2:Q2');
  assert.equal(requests, 2);
});
