import { decrypt, encrypt } from './ccavenue.js';

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

function getPricing(env) {
  const basePaise = Math.round(Number(env.CAMP_PRICE_INR) * 100);
  const gstRate = Number(env.GST_RATE_PERCENT ?? 18);
  const gstPaise = Math.round(basePaise * gstRate / 100);

  return {
    base: (basePaise / 100).toFixed(2),
    gst: (gstPaise / 100).toFixed(2),
    gstRate,
    total: ((basePaise + gstPaise) / 100).toFixed(2),
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

async function storeOrder(env, order) {
  if (!env.PAYMENTS) return;

  await env.PAYMENTS.prepare(`
    INSERT INTO payment_orders (
      order_id, amount, currency, status, parent_name, student_name,
      email, phone, created_at, updated_at
    ) VALUES (?, ?, 'INR', 'Initiated', ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    order.orderId,
    order.amount,
    order.parentName,
    order.studentName,
    order.email,
    order.phone,
  ).run();
}

async function updateOrder(env, payment) {
  if (!env.PAYMENTS) return;

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

function renderResult(payment, expectedAmount) {
  const status = payment.order_status || 'Unknown';
  const isSuccess = status === 'Success';
  const amountMatches = Number(payment.amount) === Number(expectedAmount);
  const verifiedSuccess = isSuccess && amountMatches;
  const title = verifiedSuccess
    ? 'Payment successful'
    : status === 'Aborted'
      ? 'Payment cancelled'
      : 'Payment not completed';
  const message = verifiedSuccess
    ? 'Your child’s seat request has been received. Our team will contact you with the camp joining details.'
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

  await storeOrder(env, { ...enrollment, orderId, amount });

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

async function handleCallback(request, env) {
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

    if (
      payment.merchant_id !== env.CCAVENUE_MERCHANT_ID
      || payment.currency !== 'INR'
      || Number(payment.amount) !== Number(pricing.total)
    ) {
      payment.order_status = 'Invalid';
      payment.status_message = 'Payment response did not match the order configuration.';
    }

    await updateOrder(env, payment);
    return renderResult(payment, pricing.total);
  } catch (error) {
    console.error('CCAvenue callback decryption failed', error);
    return htmlResponse('<h1>Unable to verify payment response</h1>', 400);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
      try {
        return await initiatePayment(request, env);
      } catch (error) {
        console.error('CCAvenue payment initiation failed', error);
        return htmlResponse(`<!doctype html><html><body><h1>Payment could not be started</h1><p>${escapeHtml(error.message)}</p><p><a href="/#reserve">Return to the camp page</a></p></body></html>`, 400);
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/payments/callback') {
      return handleCallback(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
