import { existsSync, readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createEnrollmentId } from '../worker/fulfillment.js';

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
    '',
    'Dry-run by default. Add --apply to mark captured Razorpay payments as Success in D1.',
    'Reads RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from the environment or .dev.vars.',
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

function formatPayment(payment) {
  if (!payment) return 'no completed payment';
  const amount = Number.isFinite(payment.amount) ? `INR ${(payment.amount / 100).toFixed(2)}` : 'amount unknown';
  return `${payment.id} ${payment.status} ${amount}`;
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
    const payments = await fetchRazorpayPayments(order.order_id, env);
    const capturedPayment = pickCapturedPayment(payments);
    console.log(`\n${order.order_id}`);
    console.log(`  D1: ${order.status} | ${order.email} | INR ${order.amount}`);
    console.log(`  Razorpay: ${formatPayment(capturedPayment)} (${payments.length} payment record${payments.length === 1 ? '' : 's'})`);

    if (!capturedPayment) continue;

    if (options.apply) {
      await runD1(updateOrderCommand(order, capturedPayment), options);
      reconciled += 1;
      console.log('  Updated D1 to Success.');
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
