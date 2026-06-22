import { existsSync, readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  appendEnrollmentSheet,
  createEnrollmentId,
  sendEnrollmentEmail,
} from '../worker/fulfillment.js';

const execFileAsync = promisify(execFile);
const DATABASE_NAME = 'codju-camp-payments';
const PENDING_STATUSES = ['Initiated', 'Pending', 'Unknown'];

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

function parseArgs(argv) {
  const options = {
    apply: false,
    local: false,
    limit: 100,
    orderId: null,
    paymentId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--local') {
      options.local = true;
    } else if (arg === '--limit') {
      options.limit = Number(argv[index + 1]);
      index += 1;
    } else if (arg === '--order-id') {
      options.orderId = argv[index + 1];
      index += 1;
    } else if (arg === '--payment-id') {
      options.paymentId = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1000) {
    throw new Error('--limit must be an integer from 1 to 1000.');
  }

  return options;
}

function usage() {
  return [
    'Usage: npm run payments:reconcile -- [--apply] [--local] [--limit 100] [--order-id order_xxx]',
    '       npm run payments:reconcile -- --order-id order_xxx --payment-id pay_xxx [--apply]',
    '',
    'Dry-run by default. Add --apply to mark captured Razorpay payments as Success in D1',
    'and immediately run EmailOctopus/Google Sheets fulfillment.',
    'Reads Razorpay and fulfillment secrets from the environment or .dev.vars.',
  ].join('\n');
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function normalizeD1Results(output) {
  const payload = JSON.parse(output);
  const first = Array.isArray(payload) ? payload[0] : payload;
  return first?.results || first?.result?.[0]?.results || [];
}

async function runD1(command, options) {
  const args = ['wrangler', 'd1', 'execute', DATABASE_NAME, '--json', '--command', command];
  if (options.local) {
    args.splice(4, 0, '--local');
  } else {
    args.splice(4, 0, '--remote');
  }

  const { stdout } = await execFileAsync('npx', args, {
    maxBuffer: 1024 * 1024 * 10,
  });
  return normalizeD1Results(stdout);
}

function pendingOrdersQuery(options) {
  if (options.orderId) {
    return `
      SELECT order_id, status, tracking_id, email, amount, payment_mode, response_message, created_at, updated_at
      FROM payment_orders
      WHERE order_id = ${sqlString(options.orderId)}
    `;
  }

  const statuses = PENDING_STATUSES.map(sqlString).join(', ');
  return `
    SELECT order_id, status, tracking_id, email, amount, payment_mode, response_message, created_at, updated_at
    FROM payment_orders
    WHERE order_id LIKE 'order_%'
      AND status IN (${statuses})
    ORDER BY created_at DESC
    LIMIT ${options.limit}
  `;
}

function orderByIdQuery(orderId) {
  return `
    SELECT *
    FROM payment_orders
    WHERE order_id = ${sqlString(orderId)}
  `;
}

async function fetchRazorpayPayments(orderId, env) {
  const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Razorpay returned ${response.status}: ${body.error?.description || body.error?.code || 'Unknown error'}`);
  }
  return body.items || [];
}

async function fetchRazorpayOrder(orderId, env) {
  const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Razorpay order lookup returned ${response.status}: ${body.error?.description || body.error?.code || 'Unknown error'}`);
  }
  return body;
}

async function fetchRazorpayPayment(paymentId, env) {
  const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Razorpay payment lookup returned ${response.status}: ${body.error?.description || body.error?.code || 'Unknown error'}`);
  }
  return body;
}

function pickCapturedPayment(payments) {
  return payments.find((payment) => payment.status === 'captured') || null;
}

function updateOrderCommand(order, payment) {
  const enrollmentId = createEnrollmentId(order.order_id);
  const method = payment.method ? `Razorpay ${payment.method}` : 'Razorpay';
  const message = `Reconciled manually from Razorpay ${payment.status} payment`;
  return `
    UPDATE payment_orders
    SET status = 'Success',
        tracking_id = ${sqlString(payment.id)},
        payment_mode = ${sqlString(method)},
        response_code = ${sqlString(`reconciled-${payment.status}`)},
        response_message = ${sqlString(message)},
        enrollment_id = COALESCE(enrollment_id, ${sqlString(enrollmentId)}),
        updated_at = datetime('now')
    WHERE order_id = ${sqlString(order.order_id)}
  `;
}

function updateFieldsCommand(orderId, fields) {
  const assignments = Object.entries(fields)
    .map(([key, value]) => `${key} = ${sqlString(value)}`)
    .join(', ');
  return `
    UPDATE payment_orders
    SET ${assignments}, updated_at = datetime('now')
    WHERE order_id = ${sqlString(orderId)}
  `;
}

function fulfillmentCompleteCommand(orderId) {
  return `
    UPDATE payment_orders
    SET fulfillment_status = 'Complete',
        fulfillment_error = NULL,
        fulfilled_at = datetime('now'),
        updated_at = datetime('now')
    WHERE order_id = ${sqlString(orderId)}
  `;
}

function requireFulfillmentVars(env) {
  const required = [
    'EMAILOCTOPUS_API_KEY',
    'EMAILOCTOPUS_LIST_ID',
    'EMAILOCTOPUS_AUTOMATION_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
  ];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing fulfillment values in environment or .dev.vars: ${missing.join(', ')}`);
  }
}

async function fulfillOrderNow(orderId, options, env) {
  requireFulfillmentVars(env);

  const [order] = await runD1(orderByIdQuery(orderId), options);
  if (!order || order.status !== 'Success' || !order.enrollment_id) {
    throw new Error(`${orderId} is not ready for fulfillment.`);
  }

  await runD1(updateFieldsCommand(orderId, {
    fulfillment_status: 'Processing',
    fulfillment_error: null,
  }), options);

  const failures = [];

  if (order.email_status !== 'Complete') {
    try {
      const result = await sendEnrollmentEmail(order, env);
      await runD1(updateFieldsCommand(orderId, {
        email_status: 'Complete',
        email_contact_id: result.contactId,
      }), options);
      console.log(`  EmailOctopus automation ${result.automationAlreadyStarted ? 'was already started' : 'queued'}.`);
    } catch (error) {
      await runD1(updateFieldsCommand(orderId, {
        email_status: 'Failed',
      }), options);
      failures.push(error);
    }
  } else {
    console.log('  EmailOctopus already complete; skipped.');
  }

  if (order.sheet_status !== 'Complete') {
    try {
      const result = await appendEnrollmentSheet(order, env);
      await runD1(updateFieldsCommand(orderId, {
        sheet_status: 'Complete',
        sheet_range: result.updatedRange,
      }), options);
      console.log(`  Google Sheets updated: ${result.updatedRange || 'range unavailable'}.`);
    } catch (error) {
      await runD1(updateFieldsCommand(orderId, {
        sheet_status: 'Failed',
      }), options);
      failures.push(error);
    }
  } else {
    console.log('  Google Sheets already complete; skipped.');
  }

  if (failures.length > 0) {
    const message = failures.map((error) => error.message || String(error)).join('; ');
    await runD1(updateFieldsCommand(orderId, {
      fulfillment_status: 'Failed',
      fulfillment_error: message.slice(0, 1000),
    }), options);
    throw new Error(message);
  }

  await runD1(fulfillmentCompleteCommand(orderId), options);
  console.log('  Fulfillment marked Complete.');
}

function formatPayment(payment) {
  if (!payment) return 'no completed payment';
  const amount = Number.isFinite(payment.amount) ? `INR ${(payment.amount / 100).toFixed(2)}` : 'amount unknown';
  return `${payment.id} ${payment.status} ${amount}`;
}

function formatOrder(order) {
  if (!order) return 'unavailable';
  const amount = Number.isFinite(order.amount) ? `INR ${(order.amount / 100).toFixed(2)}` : 'amount unknown';
  const paid = Number.isFinite(order.amount_paid) ? `paid INR ${(order.amount_paid / 100).toFixed(2)}` : 'paid amount unknown';
  return `${order.status || 'unknown'} ${amount}, ${paid}, attempts ${order.attempts ?? 'unknown'}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const env = {
    ...loadDevVars(),
    ...process.env,
  };
  const missing = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')} in environment or .dev.vars.`);
  }

  console.log(`${options.apply ? 'Applying' : 'Dry-running'} Razorpay reconciliation against ${options.local ? 'local' : 'remote'} D1...`);
  const orders = await runD1(pendingOrdersQuery(options), options);
  if (orders.length === 0) {
    console.log('No pending Razorpay orders found.');
    return;
  }

  let reconciled = 0;
  for (const order of orders) {
    const razorpayOrder = await fetchRazorpayOrder(order.order_id, env);
    const payments = await fetchRazorpayPayments(order.order_id, env);
    const directPayment = options.paymentId ? await fetchRazorpayPayment(options.paymentId, env) : null;
    if (directPayment && directPayment.order_id !== order.order_id) {
      throw new Error(`${directPayment.id} belongs to ${directPayment.order_id || 'no order'}, not ${order.order_id}.`);
    }
    const capturedPayment = directPayment?.status === 'captured'
      ? directPayment
      : pickCapturedPayment(payments);
    console.log(`\n${order.order_id}`);
    console.log(`  D1: ${order.status} | ${order.email} | INR ${order.amount}`);
    console.log(`  Razorpay order: ${formatOrder(razorpayOrder)}`);
    console.log(`  Razorpay: ${formatPayment(capturedPayment)} (${payments.length} payment record${payments.length === 1 ? '' : 's'})`);

    if (!capturedPayment) continue;

    if (options.apply) {
      await runD1(updateOrderCommand(order, capturedPayment), options);
      reconciled += 1;
      console.log('  Updated D1 to Success.');
      await fulfillOrderNow(order.order_id, options, env);
    } else {
      console.log('  Would update D1 to Success. Re-run with --apply to commit.');
    }
  }

  console.log(`\nChecked ${orders.length} order${orders.length === 1 ? '' : 's'}. ${options.apply ? `Reconciled ${reconciled}.` : 'No DB changes made.'}`);
}

try {
  await main();
} catch (error) {
  console.error(`\nReconciliation failed: ${error.message}`);
  process.exitCode = 1;
}
