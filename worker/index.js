import { decrypt, encrypt } from './ccavenue.js';
import {
  beginGoogleAuth,
  completeGoogleAuth,
  getSession,
  hasPortalAccess,
  sessionResponse,
  signOut,
} from './auth.js';
import {
  appendEnrollmentSheet,
  createEnrollmentId,
  sendEnrollmentEmail,
} from './fulfillment.js';

const CCAVENUE_URLS = {
  test: 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
  production: 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'self'",
    "connect-src 'self'",
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "form-action https://test.ccavenue.com https://secure.ccavenue.com",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

const DAY_ONE_LEVELS = new Set([
  'aicc-meet-ai',
  'aicc-magic-words',
  'aicc-meet-tools',
  'aicc-rctf',
  'aicc-prompting-in-action',
  'aicc-prompt-master',
]);

async function requirePortalSession(request, env) {
  const session = await getSession(request, env);
  if (!session) {
    return {
      response: Response.redirect(
        new URL('/sign-in', env.PUBLIC_SITE_URL),
        302,
      ),
    };
  }
  if (!await hasPortalAccess(env, session.email)) {
    return {
      response: Response.redirect(
        new URL('/access-required', env.PUBLIC_SITE_URL),
        302,
      ),
    };
  }
  return { session };
}

async function handleProgress(request, env) {
  const session = await getSession(request, env);
  if (!session || !await hasPortalAccess(env, session.email)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (request.method === 'GET') {
    const result = await env.PAYMENTS.prepare(`
      SELECT level_id
      FROM user_progress
      WHERE lower(email) = ?
      ORDER BY completed_at
    `).bind(session.email).all();
    return jsonResponse({
      completedLevels: (result.results || []).map((row) => row.level_id),
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const levelId = normalizeText(payload.levelId, 80);
  if (!DAY_ONE_LEVELS.has(levelId)) {
    return jsonResponse({ error: 'Unknown level.' }, 400);
  }

  await env.PAYMENTS.prepare(`
    INSERT OR IGNORE INTO user_progress (
      email, level_id, course_id, completed_at
    ) VALUES (?, ?, 'aicc-day1-prompting', datetime('now'))
  `).bind(session.email, levelId).run();
  return jsonResponse({ success: true });
}

function requireConfiguration(env) {
  const required = [
    'CCAVENUE_MERCHANT_ID',
    'CCAVENUE_ACCESS_CODE',
    'CCAVENUE_WORKING_KEY',
    'CAMP_PRICE_INR',
    'PUBLIC_SITE_URL',
  ];

  const missing = required.filter((key) => {
    const value = env[key];
    return !value || String(value).includes('REPLACE_WITH');
  });

  if (missing.length > 0) {
    throw new Error(`Missing Worker configuration: ${missing.join(', ')}`);
  }

  const amount = Number(env.CAMP_PRICE_INR);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('CAMP_PRICE_INR must be a positive number.');
  }

  const gstRate = Number(env.GST_RATE_PERCENT ?? 18);
  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
    throw new Error('GST_RATE_PERCENT must be between 0 and 100.');
  }
}

function requireRazorpayConfiguration(env) {
  const required = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'CAMP_PRICE_INR',
    'PUBLIC_SITE_URL',
  ];
  const missing = required.filter((key) => {
    const value = env[key];
    return !value || String(value).includes('REPLACE_WITH');
  });

  if (!env.PAYMENTS) missing.push('PAYMENTS D1 binding');
  if (missing.length > 0) {
    throw new Error(`Missing Razorpay configuration: ${missing.join(', ')}`);
  }

  const pricing = getPricing(env);
  if (Math.round(Number(pricing.total) * 100) < 100) {
    throw new Error('Payment amount must be at least 100 paise.');
  }
}

function requireFulfillmentConfiguration(env) {
  const required = [
    'EMAILOCTOPUS_API_KEY',
    'EMAILOCTOPUS_LIST_ID',
    'EMAILOCTOPUS_AUTOMATION_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
  ];
  const missing = required.filter((key) => {
    const value = env[key];
    return !value || String(value).includes('REPLACE_WITH');
  });

  if (!env.PAYMENTS) missing.push('PAYMENTS D1 binding');
  if (missing.length > 0) {
    throw new Error(`Missing fulfillment configuration: ${missing.join(', ')}`);
  }
}

function getPricing(env) {
  const totalPaise = Math.round(Number(env.CAMP_PRICE_INR) * 100);
  const gstRate = Number(env.GST_RATE_PERCENT ?? 18);
  const basePaise = Math.round(totalPaise * 100 / (100 + gstRate));
  const gstPaise = totalPaise - basePaise;

  return {
    base: (basePaise / 100).toFixed(2),
    gst: (gstPaise / 100).toFixed(2),
    gstRate,
    total: (totalPaise / 100).toFixed(2),
  };
}

function getGatewayUrl(environment) {
  if (!CCAVENUE_URLS[environment]) {
    throw new Error(
      'CCAVENUE_ENVIRONMENT must be either "test" or "production".',
    );
  }

  return CCAVENUE_URLS[environment];
}

function getSiteUrl(env) {
  const siteUrl = new URL(env.PUBLIC_SITE_URL);
  siteUrl.pathname = '/';
  siteUrl.search = '';
  siteUrl.hash = '';
  return siteUrl;
}

function validateEnrollment(data) {
  const enrollment = {
    parentName: normalizeText(data.get('parent_name'), 80),
    studentName: normalizeText(data.get('student_name'), 80),
    schoolName: normalizeText(data.get('school_name'), 120) || '',
    email: normalizeText(data.get('email'), 120).toLowerCase(),
    phone: normalizeText(data.get('phone'), 20).replace(/[^\d+]/g, ''),
  };

  if (
    !enrollment.parentName
    || !enrollment.studentName
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enrollment.email)
    || !/^\+?\d{10,15}$/.test(enrollment.phone)
  ) {
    throw new Error('Please provide valid enrollment details.');
  }

  return enrollment;
}

function validateRequestOrigin(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = new Set([
    getSiteUrl(env).origin,
    new URL(request.url).origin,
  ]);
  if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
    throw requestError('Invalid request origin.', 403);
  }
}

async function storeOrder(env, order) {
  if (!env.PAYMENTS) {
    throw new Error('PAYMENTS D1 binding is required.');
  }

  await env.PAYMENTS.prepare(`
    INSERT INTO payment_orders (
      order_id, base_amount, gst_amount, gst_rate, amount, currency, status,
      parent_name, student_name, school_name, email, phone, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'INR', 'Initiated', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    order.orderId,
    order.base,
    order.gst,
    String(order.gstRate),
    order.amount,
    order.parentName,
    order.studentName,
    order.schoolName,
    order.email,
    order.phone,
  ).run();
}

async function updateOrder(env, payment) {
  if (!env.PAYMENTS) throw new Error('PAYMENTS D1 binding is required.');

  await env.PAYMENTS.prepare(`
    UPDATE payment_orders
    SET status = ?, tracking_id = ?, bank_ref_no = ?, payment_mode = ?,
        response_code = ?, response_message = ?, updated_at = datetime('now')
    WHERE order_id = ?
  `).bind(
    payment.order_status || 'Unknown',
    payment.tracking_id || null,
    payment.bank_ref_no || null,
    payment.payment_mode || null,
    payment.status_code || null,
    payment.status_message || null,
    payment.order_id,
  ).run();
}

async function markRazorpayPaymentVerified(env, orderId, paymentId) {
  await env.PAYMENTS.prepare(`
    UPDATE payment_orders
    SET status = 'Success', tracking_id = ?, payment_mode = 'Razorpay',
        response_code = 'verified', response_message = 'Signature verified',
        updated_at = datetime('now')
    WHERE order_id = ?
  `).bind(paymentId, orderId).run();
}

async function getOrder(env, orderId) {
  return env.PAYMENTS.prepare(`
    SELECT * FROM payment_orders WHERE order_id = ?
  `).bind(orderId).first();
}

async function updateFulfillmentStep(env, orderId, fields) {
  const entries = Object.entries(fields);
  const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
  await env.PAYMENTS.prepare(`
    UPDATE payment_orders
    SET ${assignments}, updated_at = datetime('now')
    WHERE order_id = ?
  `).bind(...entries.map(([, value]) => value), orderId).run();
}

async function claimFulfillment(env, orderId) {
  const result = await env.PAYMENTS.prepare(`
    UPDATE payment_orders
    SET fulfillment_status = 'Processing', fulfillment_error = NULL,
        updated_at = datetime('now')
    WHERE order_id = ?
      AND (
        fulfillment_status IN ('Pending', 'Failed')
        OR (
          fulfillment_status = 'Processing'
          AND updated_at <= datetime('now', '-10 minutes')
        )
      )
  `).bind(orderId).run();

  return Number(result.meta?.changes || 0) > 0;
}

async function fulfillOrder(env, orderId) {
  const claimed = await claimFulfillment(env, orderId);
  if (!claimed) return;

  try {
    requireFulfillmentConfiguration(env);
    const order = await getOrder(env, orderId);
    if (!order || order.status !== 'Success' || !order.enrollment_id) {
      throw new Error('Paid order is not ready for fulfillment.');
    }

    const tasks = [];

    if (order.email_status !== 'Complete') {
      tasks.push((async () => {
        try {
          const result = await sendEnrollmentEmail(order, env);
          await updateFulfillmentStep(env, orderId, {
            email_status: 'Complete',
            email_contact_id: result.contactId,
          });
        } catch (error) {
          await updateFulfillmentStep(env, orderId, {
            email_status: 'Failed',
          });
          throw error;
        }
      })());
    }

    if (order.sheet_status !== 'Complete') {
      tasks.push((async () => {
        try {
          const result = await appendEnrollmentSheet(order, env);
          await updateFulfillmentStep(env, orderId, {
            sheet_status: 'Complete',
            sheet_range: result.updatedRange,
          });
        } catch (error) {
          await updateFulfillmentStep(env, orderId, {
            sheet_status: 'Failed',
          });
          throw error;
        }
      })());
    }

    const results = await Promise.allSettled(tasks);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(
        failures.map((result) => result.reason?.message || 'Unknown error').join('; '),
      );
    }

    await env.PAYMENTS.prepare(`
      UPDATE payment_orders
      SET fulfillment_status = 'Complete', fulfillment_error = NULL,
          fulfilled_at = datetime('now'), updated_at = datetime('now')
      WHERE order_id = ?
    `).bind(orderId).run();
  } catch (error) {
    console.error('Payment fulfillment failed', error);
    await updateFulfillmentStep(env, orderId, {
      fulfillment_status: 'Failed',
      fulfillment_error: String(error?.message || error).slice(0, 1000),
    });
  }
}

async function retryPendingFulfillments(env) {
  requireFulfillmentConfiguration(env);
  const result = await env.PAYMENTS.prepare(`
    SELECT order_id
    FROM payment_orders
    WHERE status = 'Success'
      AND (
        fulfillment_status IN ('Pending', 'Failed')
        OR (
          fulfillment_status = 'Processing'
          AND updated_at <= datetime('now', '-10 minutes')
        )
      )
    ORDER BY updated_at
    LIMIT 20
  `).all();

  await Promise.all(
    (result.results || []).map(({ order_id: orderId }) => fulfillOrder(env, orderId)),
  );
}

async function createRazorpayOrder(request, env) {
  requireRazorpayConfiguration(env);
  requireFulfillmentConfiguration(env);
  validateRequestOrigin(request, env);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
  }

  const formData = new FormData();
  formData.set('parent_name', payload.parent_name || '');
  formData.set('student_name', payload.student_name || '');
  formData.set('school_name', payload.school_name || '');
  formData.set('email', payload.email || '');
  formData.set('phone', payload.phone || '');
  let enrollment;
  try {
    enrollment = validateEnrollment(formData);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
  const pricing = getPricing(env);
  const amount = Math.round(Number(pricing.total) * 100);
  if (!Number.isInteger(amount) || amount < 100) {
    return jsonResponse({ error: 'Payment amount must be at least 100 paise.' }, 400);
  }

  const receipt = `CODJU-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
  const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  let razorpayResponse;

  try {
    razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          student_name: enrollment.studentName,
          parent_email: enrollment.email,
        },
      }),
    });
  } catch (error) {
    console.error('Razorpay order request failed', error);
    return jsonResponse({ error: 'Unable to contact the payment provider.' }, 500);
  }

  const responseData = await razorpayResponse.json().catch(() => ({}));
  if (!razorpayResponse.ok) {
    console.error('Razorpay order creation failed', {
      status: razorpayResponse.status,
      code: responseData.error?.code,
    });
    const status = razorpayResponse.status === 401 ? 401 : 500;
    return jsonResponse(
      {
        error: status === 401
          ? 'Payment provider authentication failed.'
          : 'Unable to create a payment order.',
      },
      status,
    );
  }

  if (
    !responseData.id
    || responseData.amount !== amount
    || responseData.currency !== 'INR'
  ) {
    return jsonResponse({ error: 'Payment provider returned an invalid order.' }, 500);
  }

  await storeOrder(env, {
    ...enrollment,
    orderId: responseData.id,
    amount: pricing.total,
    ...pricing,
  });

  return jsonResponse({
    order_id: responseData.id,
    amount: responseData.amount,
    currency: responseData.currency,
    key_id: env.RAZORPAY_KEY_ID,
  });
}

async function generateRazorpaySignature(orderId, paymentId, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${orderId}|${paymentId}`),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function signaturesMatch(expected, received) {
  if (
    typeof received !== 'string'
    || expected.length !== received.length
    || !/^[a-f0-9]+$/i.test(received)
  ) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return mismatch === 0;
}

async function verifyRazorpayPayment(request, env, ctx) {
  requireRazorpayConfiguration(env);
  validateRequestOrigin(request, env);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
  }

  const orderId = normalizeText(payload.razorpay_order_id, 80);
  const paymentId = normalizeText(payload.razorpay_payment_id, 80);
  const receivedSignature = normalizeText(payload.razorpay_signature, 128);
  if (!orderId || !paymentId || !receivedSignature) {
    return jsonResponse({ error: 'Missing payment verification fields.' }, 400);
  }

  const order = await getOrder(env, orderId);
  if (!order) {
    return jsonResponse({ error: 'Payment order was not found.' }, 400);
  }

  const expectedSignature = await generateRazorpaySignature(
    order.order_id,
    paymentId,
    env.RAZORPAY_KEY_SECRET,
  );
  if (!signaturesMatch(expectedSignature, receivedSignature)) {
    return jsonResponse({ error: 'Payment signature verification failed.' }, 400);
  }

  await markRazorpayPaymentVerified(env, order.order_id, paymentId);
  let verifiedOrder = await getOrder(env, order.order_id);
  if (!verifiedOrder.enrollment_id) {
    await updateFulfillmentStep(env, order.order_id, {
      enrollment_id: createEnrollmentId(order.order_id),
    });
    verifiedOrder = await getOrder(env, order.order_id);
  }

  if (verifiedOrder.fulfillment_status !== 'Complete') {
    ctx.waitUntil(fulfillOrder(env, order.order_id));
  }

  return jsonResponse({
    success: true,
    enrollment_id: verifiedOrder.enrollment_id,
  });
}

function renderGatewayRedirect(gatewayUrl, encryptedRequest, accessCode) {
  return htmlResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening secure payment</title>
  <style>
    body{font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;margin:0;background:#f5f0ff;color:#18181b}
    main{text-align:center;padding:32px}.spinner{width:42px;height:42px;border:4px solid #d9c7ff;border-top-color:#7c3aed;border-radius:50%;margin:0 auto 20px;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <main>
    <div class="spinner" aria-hidden="true"></div>
    <h1>Opening secure payment...</h1>
    <p>You are being redirected to CCAvenue.</p>
    <form id="ccavenue-form" method="post" action="${escapeHtml(gatewayUrl)}">
      <input type="hidden" name="encRequest" value="${escapeHtml(encryptedRequest)}">
      <input type="hidden" name="access_code" value="${escapeHtml(accessCode)}">
      <noscript><button type="submit">Continue to payment</button></noscript>
    </form>
  </main>
  <script src="/payment/submit.js"></script>
</body>
</html>`);
}

function renderResult(payment, expectedAmount, order = null) {
  const status = payment.order_status || 'Unknown';
  const isSuccess = status === 'Success';
  const amountMatches = Number(payment.amount) === Number(expectedAmount);
  const verifiedSuccess = isSuccess && amountMatches;
  const title = verifiedSuccess
    ? 'Enrollment confirmed'
    : status === 'Aborted'
      ? 'Payment cancelled'
      : 'Payment not completed';
  const message = verifiedSuccess
    ? 'Payment is verified and the seat is reserved. The confirmation email will arrive shortly.'
    : status === 'Aborted'
      ? 'No payment was completed. You can return to the camp page and try again.'
      : 'We could not confirm this payment. Please try again or contact the Codju admissions team.';
  const tone = verifiedSuccess ? '#16a34a' : '#b45309';

  return htmlResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Codju</title>
  <style>
    *{box-sizing:border-box}body{font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;margin:0;padding:24px;background:linear-gradient(135deg,#f5f0ff,#fff);color:#18181b}
    main{width:min(560px,100%);background:#fff;border:1px solid #e4e4e7;border-radius:24px;padding:36px;box-shadow:0 20px 60px rgba(0,0,0,.1)}
    .status{color:${tone};font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:13px}h1{font-size:clamp(28px,6vw,42px);margin:10px 0 12px}p{color:#52525b;line-height:1.65}
    dl{display:grid;grid-template-columns:auto 1fr;gap:10px 20px;margin:26px 0;padding:20px;background:#fafafa;border-radius:14px}dt{color:#71717a}dd{margin:0;text-align:right;font-weight:700;overflow-wrap:anywhere}
    a{display:inline-flex;padding:12px 20px;border-radius:12px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <main>
    <div class="status">${escapeHtml(status)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <dl>
      <dt>Order ID</dt><dd>${escapeHtml(payment.order_id || 'Unavailable')}</dd>
      ${order?.enrollment_id ? `<dt>Enrollment ID</dt><dd>${escapeHtml(order.enrollment_id)}</dd>` : ''}
      <dt>Amount</dt><dd>INR ${escapeHtml(payment.amount || expectedAmount)}</dd>
      <dt>Tracking ID</dt><dd>${escapeHtml(payment.tracking_id || 'Unavailable')}</dd>
    </dl>
    <a href="/#reserve">${verifiedSuccess ? 'Return to camp page' : 'Try payment again'}</a>
  </main>
</body>
</html>`, verifiedSuccess || status === 'Aborted' ? 200 : 400);
}

async function initiatePayment(request, env) {
  requireConfiguration(env);
  requireFulfillmentConfiguration(env);

  const siteUrl = getSiteUrl(env);
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== siteUrl.origin) {
    return new Response('Invalid request origin.', { status: 403 });
  }

  const enrollment = validateEnrollment(await request.formData());
  const orderId = `CODJU-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const pricing = getPricing(env);
  const amount = pricing.total;
  const callbackUrl = new URL('/api/payments/callback', siteUrl).toString();

  await storeOrder(env, {
    ...enrollment,
    orderId,
    amount,
    ...pricing,
  });

  const paymentData = new URLSearchParams({
    merchant_id: env.CCAVENUE_MERCHANT_ID,
    order_id: orderId,
    currency: 'INR',
    amount,
    redirect_url: callbackUrl,
    cancel_url: callbackUrl,
    language: 'EN',
    billing_name: enrollment.parentName,
    billing_email: enrollment.email,
    billing_tel: enrollment.phone,
    merchant_param1: enrollment.studentName,
    merchant_param3: pricing.base,
    merchant_param4: pricing.gst,
    merchant_param5: String(pricing.gstRate),
  });

  const encryptedRequest = encrypt(
    paymentData.toString(),
    env.CCAVENUE_WORKING_KEY,
  );

  return renderGatewayRedirect(
    getGatewayUrl(env.CCAVENUE_ENVIRONMENT),
    encryptedRequest,
    env.CCAVENUE_ACCESS_CODE,
  );
}

async function handleCallback(request, env, ctx) {
  requireConfiguration(env);
  const pricing = getPricing(env);
  const formData = await request.formData();
  const encryptedResponse = normalizeText(formData.get('encResp'), 20000);

  if (!encryptedResponse || !/^[a-fA-F0-9]+$/.test(encryptedResponse)) {
    return htmlResponse('<h1>Invalid payment response</h1>', 400);
  }

  try {
    const payment = Object.fromEntries(
      new URLSearchParams(decrypt(encryptedResponse, env.CCAVENUE_WORKING_KEY)),
    );
    let order = await getOrder(env, payment.order_id);
    const expectedAmount = order?.amount || pricing.total;

    if (
      payment.merchant_id !== env.CCAVENUE_MERCHANT_ID
      || payment.currency !== 'INR'
      || !order
      || Number(payment.amount) !== Number(expectedAmount)
    ) {
      payment.order_status = 'Invalid';
      payment.status_message = 'Payment response did not match the order configuration.';
    }

    await updateOrder(env, payment);

    if (payment.order_status !== 'Success') {
      return renderResult(payment, expectedAmount);
    }

    if (!order.enrollment_id) {
      const enrollmentId = createEnrollmentId(payment.order_id);
      await updateFulfillmentStep(env, payment.order_id, {
        enrollment_id: enrollmentId,
      });
      order = await getOrder(env, payment.order_id);
    }

    if (order.fulfillment_status !== 'Complete') {
      ctx.waitUntil(fulfillOrder(env, payment.order_id));
    }

    return renderResult(payment, expectedAmount, order);
  } catch (error) {
    console.error('CCAvenue callback processing failed', error);
    return htmlResponse('<h1>Unable to process payment response</h1>', 400);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/auth/signin') {
      return beginGoogleAuth(env);
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/callback') {
      return completeGoogleAuth(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/signout') {
      return signOut(env);
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const session = await getSession(request, env);
      return session
        ? sessionResponse(session)
        : jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (
      url.pathname === '/api/progress'
      && (request.method === 'GET' || request.method === 'POST')
    ) {
      return handleProgress(request, env);
    }

    if (url.pathname === '/learn' || url.pathname.startsWith('/learn/')) {
      const auth = await requirePortalSession(request, env);
      if (auth.response) return auth.response;
    }

    if (request.method === 'POST' && url.pathname === '/api/create-order') {
      if (env.REGISTRATION_STATUS !== 'open') {
        return jsonResponse(
          { error: 'Online registrations are temporarily unavailable.' },
          503,
        );
      }

      try {
        return await createRazorpayOrder(request, env);
      } catch (error) {
        console.error('Razorpay order creation failed', error);
        return jsonResponse(
          { error: error.status ? error.message : 'Unable to create payment order.' },
          error.status || 500,
        );
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/verify-payment') {
      try {
        return await verifyRazorpayPayment(request, env, ctx);
      } catch (error) {
        console.error('Razorpay payment verification failed', error);
        return jsonResponse({ error: 'Unable to verify payment.' }, 500);
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/payments/quote') {
      try {
        requireConfiguration(env);
        return Response.json(getPricing(env), {
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    if (request.method === 'GET' && url.pathname === '/payment/submit.js') {
      return new Response(
        "document.getElementById('ccavenue-form')?.submit();",
        {
          headers: {
            'Content-Type': 'text/javascript; charset=UTF-8',
            'Cache-Control': 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      );
    }

    if (request.method === 'POST' && url.pathname === '/api/payments/initiate') {
      return jsonResponse(
        { error: 'CCAvenue checkout has been retired. Use Razorpay checkout.' },
        410,
      );
    }

    if (request.method === 'POST' && url.pathname === '/api/payments/callback') {
      return handleCallback(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    if (env.REGISTRATION_STATUS !== 'open') return;
    ctx.waitUntil(retryPendingFulfillments(env));
  },
};
