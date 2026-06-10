import { existsSync, readFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import {
  appendEnrollmentSheet,
  createEnrollmentId,
  sendEnrollmentEmail,
} from '../worker/fulfillment.js';

function loadDevVars() {
  if (!existsSync('.dev.vars')) return {};

  return Object.fromEntries(
    readFileSync('.dev.vars', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"'))
          || (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value.replaceAll('\\n', '\n')];
      }),
  );
}

function requireVars(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Add these values to .dev.vars: ${missing.join(', ')}`);
  }
}

function createTestOrder(email) {
  const orderId = `LOCAL-${Date.now()}`;
  return {
    enrollment_id: createEnrollmentId(orderId),
    order_id: orderId,
    tracking_id: 'LOCAL-TRACKING-ID',
    parent_name: 'Local Test Parent',
    student_name: 'Local Test Student',
    email,
    phone: '9999999999',
    base_amount: '100.00',
    gst_amount: '18.00',
    gst_rate: '18',
    amount: '118.00',
    currency: 'INR',
    payment_mode: 'Local Test',
    bank_ref_no: 'LOCAL-BANK-REF',
    status: 'Success',
    created_at: new Date().toISOString(),
  };
}

function printRequest(label, url, options = {}) {
  const safeUrl = new URL(String(url));
  if (safeUrl.searchParams.has('api_key')) {
    safeUrl.searchParams.set('api_key', '<redacted>');
  }
  let body;
  if (options.body) {
    try {
      body = JSON.parse(String(options.body));
      if (body.api_key) body.api_key = '<redacted>';
    } catch {
      body = String(options.body);
    }
  }
  console.log(`\n${label}: ${options.method || 'GET'} ${safeUrl}`);
  if (body) console.log(JSON.stringify(body, null, 2));
}

async function testEmail(mode, devVars, emailArgument) {
  const order = createTestOrder(
    emailArgument || devVars.TEST_ENROLLMENT_EMAIL || 'local-test@example.com',
  );
  let env;
  let fetchImpl;

  if (mode === 'live') {
    requireVars(devVars, [
      'EMAILOCTOPUS_API_KEY',
      'EMAILOCTOPUS_LIST_ID',
      'EMAILOCTOPUS_AUTOMATION_ID',
      'TEST_ENROLLMENT_EMAIL',
    ]);
    env = devVars;
    fetchImpl = fetch;
    console.log(`Starting a real EmailOctopus automation for ${order.email}...`);
  } else {
    env = {
      EMAILOCTOPUS_API_KEY: 'mock-api-key',
      EMAILOCTOPUS_LIST_ID: 'mock-list-id',
      EMAILOCTOPUS_AUTOMATION_ID: 'mock-automation-id',
    };
    fetchImpl = async (url, options = {}) => {
      printRequest('Mock EmailOctopus request', url, options);
      const pathname = new URL(url).pathname;
      if (options.method === 'GET') return Response.json({}, { status: 404 });
      if (pathname.endsWith('/contacts') && options.method === 'POST') {
        return Response.json({ id: 'mock-contact-id' });
      }
      return Response.json({});
    };
  }

  const result = await sendEnrollmentEmail(order, env, fetchImpl);
  console.log(`\nEmail test complete. Contact ID: ${result.contactId}`);
}

async function testSheet(mode, devVars) {
  const order = createTestOrder(
    devVars.TEST_ENROLLMENT_EMAIL || 'local-test@example.com',
  );
  let env;
  let fetchImpl;

  if (mode === 'live') {
    requireVars(devVars, [
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
      'GOOGLE_SHEETS_SPREADSHEET_ID',
    ]);
    env = devVars;
    fetchImpl = fetch;
    console.log(`Appending real test enrollment ${order.enrollment_id}...`);
  } else {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    env = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'mock@example.iam.gserviceaccount.com',
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey.export({
        type: 'pkcs8',
        format: 'pem',
      }),
      GOOGLE_SHEETS_SPREADSHEET_ID: 'mock-spreadsheet-id',
      GOOGLE_SHEETS_RANGE: 'Enrollments!A:Q',
    };
    fetchImpl = async (url, options = {}) => {
      printRequest('Mock Google request', url, options);
      const hostname = new URL(url).hostname;
      if (hostname === 'oauth2.googleapis.com') {
        return Response.json({ access_token: 'mock-access-token' });
      }
      if (!options.method) {
        return Response.json({ values: [['Enrollment ID']] });
      }
      return Response.json({ updates: { updatedRange: 'Enrollments!A2:Q2' } });
    };
  }

  const result = await appendEnrollmentSheet(order, env, fetchImpl);
  console.log(`\nSheet test complete. Range: ${result.updatedRange}`);
}

const [provider, flag, emailArgument] = process.argv.slice(2);
const mode = flag === '--live' ? 'live' : 'mock';
const devVars = loadDevVars();

if (!['email', 'sheet'].includes(provider)) {
  console.error('Usage: node scripts/smoke-fulfillment.mjs <email|sheet> [--live] [email]');
  process.exitCode = 1;
} else {
  try {
    if (provider === 'email') {
      await testEmail(mode, devVars, emailArgument);
    } else {
      await testSheet(mode, devVars);
    }
  } catch (error) {
    console.error(`\n${provider} ${mode} test failed: ${error.message}`);
    process.exitCode = 1;
  }
}
