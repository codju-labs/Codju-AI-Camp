const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SESSION_COOKIE = 'codju_aicc_session';
const STATE_COOKIE = 'codju_aicc_oauth_state';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  const bytes = typeof value === 'string'
    ? new TextEncoder().encode(value)
    : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function cookieSecurity(env) {
  return new URL(env.PUBLIC_SITE_URL).protocol === 'https:' ? '; Secure' : '';
}

function createCookie(name, value, env, maxAge, httpOnly = true) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    httpOnly ? 'HttpOnly' : '',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    cookieSecurity(env),
  ].filter(Boolean).join('; ');
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function createSessionToken(user, secret) {
  const payload = base64UrlEncode(JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  }));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${base64UrlEncode(signature)}`;
}

export async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !env.AUTH_SECRET) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  try {
    const key = await importHmacKey(env.AUTH_SECRET);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const data = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (!data.email || data.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      email: String(data.email).trim().toLowerCase(),
      name: String(data.name || ''),
      image: data.image ? String(data.image) : null,
    };
  } catch {
    return null;
  }
}

function getRedirectUri(env) {
  return new URL('/api/auth/callback', env.PUBLIC_SITE_URL).toString();
}

export function beginGoogleAuth(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.AUTH_SECRET) {
    return Response.json(
      { error: 'Google authentication is not configured.' },
      { status: 503 },
    );
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(env),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GOOGLE_AUTH_URL}?${params}`,
      'Set-Cookie': createCookie(STATE_COOKIE, state, env, 600),
      'Cache-Control': 'no-store',
    },
  });
}

export async function completeGoogleAuth(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const storedState = getCookie(request, STATE_COOKIE);
  const signInUrl = new URL('/sign-in?error=auth_failed', env.PUBLIC_SITE_URL);

  if (!code || !returnedState || returnedState !== storedState) {
    return Response.redirect(signInUrl, 302);
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(env),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) throw new Error('Google token exchange failed.');

    const tokens = await tokenResponse.json();
    const userResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userResponse.ok) throw new Error('Google user lookup failed.');

    const googleUser = await userResponse.json();
    if (!googleUser.email || googleUser.email_verified === false) {
      throw new Error('A verified Google email is required.');
    }

    const session = await createSessionToken({
      email: googleUser.email.toLowerCase(),
      name: googleUser.name || '',
      image: googleUser.picture || null,
    }, env.AUTH_SECRET);

    const headers = new Headers({
      Location: new URL('/learn', env.PUBLIC_SITE_URL).toString(),
      'Cache-Control': 'no-store',
    });
    headers.append(
      'Set-Cookie',
      createCookie(SESSION_COOKIE, session, env, SESSION_SECONDS),
    );
    headers.append(
      'Set-Cookie',
      createCookie(STATE_COOKIE, '', env, 0),
    );

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error('Google authentication failed', error);
    return Response.redirect(signInUrl, 302);
  }
}

export function signOut(env) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/sign-in', env.PUBLIC_SITE_URL).toString(),
      'Set-Cookie': createCookie(SESSION_COOKIE, '', env, 0),
      'Cache-Control': 'no-store',
    },
  });
}

function configuredTestEmails(env) {
  return new Set(
    String(env.ACCESS_TEST_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function hasPortalAccess(env, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !env.PAYMENTS) return false;
  if (configuredTestEmails(env).has(normalizedEmail)) return true;

  const paidOrder = await env.PAYMENTS.prepare(`
    SELECT order_id
    FROM payment_orders
    WHERE lower(email) = ? AND status = 'Success'
    LIMIT 1
  `).bind(normalizedEmail).first();
  if (paidOrder) return true;

  try {
    const linkedAccess = await env.PAYMENTS.prepare(`
      SELECT email
      FROM portal_access
      WHERE lower(email) = ?
      LIMIT 1
    `).bind(normalizedEmail).first();
    return Boolean(linkedAccess);
  } catch (error) {
    console.warn('Portal access table is not available yet', error);
    return false;
  }
}

export function sessionResponse(session) {
  return Response.json(
    { user: session },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
