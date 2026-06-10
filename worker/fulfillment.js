import {
  createHash,
  createSign,
} from 'node:crypto';

function requireOk(response, service, body) {
  if (!response.ok) {
    throw new Error(`${service} returned ${response.status}: ${body.slice(0, 300)}`);
  }
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function createEnrollmentId(orderId) {
  const orderTimestamp = Number(String(orderId).split('-')[1]);
  const enrollmentYear = Number.isFinite(orderTimestamp)
    ? new Date(orderTimestamp).getUTCFullYear()
    : new Date().getUTCFullYear();
  const digest = createHash('sha256')
    .update(orderId, 'utf8')
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `AICC-${enrollmentYear}-${digest}`;
}

async function emailOctopusRequest(path, env, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`https://emailoctopus.com/api/1.6${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.text();
  let data = {};
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    data = { message: body };
  }
  return { response, data };
}

export async function sendEnrollmentEmail(order, env, fetchImpl = fetch) {
  const memberHash = createHash('md5')
    .update(order.email.toLowerCase(), 'utf8')
    .digest('hex');
  const fields = {
    ParentName: order.parent_name,
    StudentName: order.student_name,
    EnrollmentId: order.enrollment_id,
    OrderId: order.order_id,
    AmountPaid: order.amount,
    TrackingId: order.tracking_id || '',
  };
  const contactPath = `/lists/${encodeURIComponent(env.EMAILOCTOPUS_LIST_ID)}/contacts`;
  const getContact = await emailOctopusRequest(
    `${contactPath}/${memberHash}?api_key=${encodeURIComponent(env.EMAILOCTOPUS_API_KEY)}`,
    env,
    { method: 'GET' },
    fetchImpl,
  );

  let contact;
  if (getContact.response.ok) {
    const updated = await emailOctopusRequest(
      `${contactPath}/${memberHash}`,
      env,
      {
        method: 'PUT',
        body: JSON.stringify({
          api_key: env.EMAILOCTOPUS_API_KEY,
          email_address: order.email,
          fields,
          tags: { 'camp-enrolled': true },
          status: 'SUBSCRIBED',
        }),
      },
      fetchImpl,
    );
    requireOk(updated.response, 'EmailOctopus contact update', JSON.stringify(updated.data));
    contact = updated.data;
  } else if (getContact.response.status === 404) {
    const created = await emailOctopusRequest(
      contactPath,
      env,
      {
        method: 'POST',
        body: JSON.stringify({
          api_key: env.EMAILOCTOPUS_API_KEY,
          email_address: order.email,
          fields,
          tags: ['camp-enrolled'],
          status: 'SUBSCRIBED',
        }),
      },
      fetchImpl,
    );
    requireOk(created.response, 'EmailOctopus contact creation', JSON.stringify(created.data));
    contact = created.data;
  } else {
    requireOk(
      getContact.response,
      'EmailOctopus contact lookup',
      JSON.stringify(getContact.data),
    );
  }

  const queued = await emailOctopusRequest(
    `/automations/${encodeURIComponent(env.EMAILOCTOPUS_AUTOMATION_ID)}/queue`,
    env,
    {
      method: 'POST',
      body: JSON.stringify({
        api_key: env.EMAILOCTOPUS_API_KEY,
        list_member_id: contact.id,
      }),
    },
    fetchImpl,
  );
  const automationErrorCode = queued.data.code || queued.data.error?.code;
  if (!queued.response.ok && automationErrorCode === 'UNAUTHORISED') {
    throw new Error(
      'EmailOctopus rejected the automation. Confirm it is active, uses the '
      + '"Started via API" trigger, and belongs to the same account as the API key.',
    );
  }
  if (!queued.response.ok && automationErrorCode !== 'ALREADY_STARTED') {
    requireOk(queued.response, 'EmailOctopus automation', JSON.stringify(queued.data));
  }

  return { contactId: contact.id };
}

async function getGoogleAccessToken(env, fetchImpl) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(
    env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replaceAll('\\n', '\n'),
  );
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.text();
  requireOk(response, 'Google OAuth', body);
  const token = JSON.parse(body);
  if (!token.access_token) throw new Error('Google OAuth did not return an access token.');
  return token.access_token;
}

export async function appendEnrollmentSheet(order, env, fetchImpl = fetch) {
  const accessToken = await getGoogleAccessToken(env, fetchImpl);
  const range = env.GOOGLE_SHEETS_RANGE || 'Enrollments!A:Q';
  const sheetName = range.split('!')[0];
  const lookupUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_SPREADSHEET_ID)}/values/${encodeURIComponent(`${sheetName}!A:A`)}`,
  );
  const lookupResponse = await fetchImpl(lookupUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const lookupBody = await lookupResponse.text();
  requireOk(lookupResponse, 'Google Sheets enrollment lookup', lookupBody);
  const existingValues = JSON.parse(lookupBody).values || [];
  const existingRow = existingValues.findIndex(
    (row) => String(row[0] || '') === order.enrollment_id,
  );
  if (existingRow >= 0) {
    return { updatedRange: `${sheetName}!A${existingRow + 1}:Q${existingRow + 1}` };
  }

  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_SPREADSHEET_ID)}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set('valueInputOption', 'USER_ENTERED');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      majorDimension: 'ROWS',
      values: [[
        order.enrollment_id,
        order.order_id,
        order.tracking_id || '',
        order.parent_name,
        order.student_name,
        order.email,
        order.phone,
        order.base_amount,
        order.gst_amount,
        order.gst_rate,
        order.amount,
        order.currency,
        order.payment_mode || '',
        order.bank_ref_no || '',
        order.status,
        order.created_at,
        new Date().toISOString(),
      ]],
    }),
  });
  const body = await response.text();
  requireOk(response, 'Google Sheets append', body);
  const data = JSON.parse(body);
  return { updatedRange: data.updates?.updatedRange || '' };
}
