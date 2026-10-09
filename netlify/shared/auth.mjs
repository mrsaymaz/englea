// v12.0.0 · Teacher sessions, checked on the server.
// - A device gets a signed, HttpOnly device cookie. The first time a device signs in it needs the time code AND the
//   Teacher PIN (checked by Apps Script). After that the device is trusted for 180 days and the time code alone opens
//   a 12-hour session cookie.
// - Lockouts live on the server (Netlify Blobs): per device (3 wrong codes → 6 h, the unlock code still works; 3 wrong
//   unlock codes → no code at all until the lock ends; 5 wrong PINs → 6 h), and for devices that are not yet trusted
//   also per network and site-wide, so guessing from new browsers is slow everywhere while the teacher's own trusted
//   board and phone are never locked out by someone else on the school network.
// - Every API call (TURN credentials, roster, Google Sheets) needs a valid session. Requests to Apps Script carry the
//   server key, so the Apps Script web app only answers this site.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_MS = 12 * 3600 * 1000;
export const DEVICE_TTL_MS = 180 * 24 * 3600 * 1000;
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const LOCK_MS = 6 * 3600 * 1000;
const HOUR = 3600 * 1000;
export const LIMITS = Object.freeze({
  codeFailures: 3,      // wrong time codes on one device before it locks for six hours
  unlockFailures: 3,    // wrong codes while locked before the unlock code stops working too
  pinFailures: 5,       // wrong Teacher PINs while signing a device in
  networkFailures: 10,  // failures per hour from one network by devices that are not trusted yet
  siteFailures: 40,     // failures per hour on the whole site by devices that are not trusted yet
  apiPinFailures: 5,    // wrong PINs in Manage, Studio or Save Record before a 15-minute pause
  apiPinLockMs: 15 * 60 * 1000,
  turnPerHour: 60       // TURN credential requests per device and hour
});
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1slB2qFrDkSp_4AsW7NGiADQju3TisakEWG-s1lGwAoho9gkAoz9enWZbAIEMT9eZww/exec';
export const scriptUrl = (env = process.env) => env.APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL;

// ---- Storage: Netlify Blobs on the site, memory in tests (and as a last resort) ----
export function memoryStore() {
  const map = new Map();
  return {
    kind: 'memory',
    async get(key) { return map.has(key) ? JSON.parse(map.get(key)) : null; },
    async set(key, value) { map.set(key, JSON.stringify(value)); },
    async setIfNew(key, value) { if (map.has(key)) return false; map.set(key, JSON.stringify(value)); return true; },
    dump: () => Object.fromEntries([...map].map(([k, v]) => [k, JSON.parse(v)]))
  };
}
let siteStore = null, fallbackStore = null;
export async function defaultStore() {
  if (siteStore) return siteStore;
  try {
    const { getStore } = await import('@netlify/blobs');
    const blobs = getStore({ name: 'english-league-auth', consistency: 'strong' });
    const store = {
      kind: 'blobs',
      get: key => blobs.get(key, { type: 'json' }),
      set: (key, value) => blobs.setJSON(key, value),
      async setIfNew(key, value) { const result = await blobs.setJSON(key, value, { onlyIfNew: true }); return result?.modified !== false; }
    };
    await store.get('config:probe');
    siteStore = store;
    return store;
  } catch (error) {
    console.error('Netlify Blobs is unavailable; sign-in limits fall back to this function instance only.', error?.message || error);
    fallbackStore ??= memoryStore();
    return fallbackStore;
  }
}

// The signing secret: LEAGUE_SESSION_SECRET if it is set (recommended), otherwise one generated once and kept in Blobs.
export async function resolveSecret(store, env = process.env) {
  const configured = String(env.LEAGUE_SESSION_SECRET || '');
  if (configured.length >= 24) return configured;
  if (configured) console.warn('LEAGUE_SESSION_SECRET is shorter than 24 characters and is ignored.');
  let saved = await store.get('config:secret');
  if (!saved?.secret) {
    await store.setIfNew('config:secret', { secret: randomBytes(32).toString('base64url'), createdAt: Date.now() });
    saved = await store.get('config:secret');
  }
  if (!saved?.secret) throw Error('No session secret');
  return saved.secret;
}

// ---- Signed tokens (device, session, PIN challenge) ----
export function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + createHmac('sha256', secret).update(body).digest('base64url');
}
export function verify(token, secret, type, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  let given;
  try { given = Buffer.from(parts[1], 'base64url'); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { return null; }
  if (!payload || payload.t !== type || !Number.isFinite(payload.exp) || payload.exp <= now) return null;
  return payload;
}

// ---- Cookies: __Host- prefixed and Secure on the site; plain names on http://127.0.0.1 in the tests ----
const secureRequest = request => new URL(request.url).protocol === 'https:';
export const cookieName = (base, request) => (secureRequest(request) ? '__Host-' : '') + base;
export function readCookie(request, base) {
  const name = cookieName(base, request), header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) { try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return null; } }
  }
  return null;
}
export function cookie(request, base, value, maxAgeMs) {
  return `${cookieName(base, request)}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${secureRequest(request) ? '; Secure' : ''}; Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`;
}

export function json(body, status = 200, cookies = []) {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0', 'Netlify-CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(JSON.stringify(body), { status, headers });
}

export function clientIp(request) {
  return request.headers.get('x-nf-client-connection-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}
const networkKey = (request, secret) => 'net:' + createHmac('sha256', secret).update(clientIp(request)).digest('hex').slice(0, 32);

export function readDevice(request, secret, now = Date.now()) {
  const payload = verify(readCookie(request, 'league_device'), secret, 'd', now);
  return payload && typeof payload.id === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(payload.id) ? payload : null;
}
export function newDevice(now = Date.now()) {
  return { t: 'd', id: randomBytes(18).toString('base64url'), trusted: false, iat: now, exp: now + DEVICE_TTL_MS };
}
export const deviceCookie = (request, device, secret) => cookie(request, 'league_device', sign(device, secret), device.exp - device.iat);
export function sessionCookie(request, device, kind, secret, now = Date.now()) {
  const session = { t: 's', d: device.id, k: kind, iat: now, exp: now + SESSION_TTL_MS };
  return { session, header: cookie(request, 'league_session', sign(session, secret), SESSION_TTL_MS) };
}

// ---- Counters ----
const freshWindow = (record, now) => (!record || !Number.isFinite(record.windowStart) || now - record.windowStart >= HOUR) ? { count: 0, windowStart: now, lockedUntil: record?.lockedUntil || 0 } : record;
export const blankDevice = () => ({ codeFailures: 0, lockedUntil: 0, unlockFailures: 0, hardUntil: 0, pinFailures: 0, pinLockedUntil: 0, apiPin: { count: 0, windowStart: 0, lockedUntil: 0 }, turn: { count: 0, windowStart: 0 } });
export async function deviceRecord(store, id) { return { ...blankDevice(), ...(await store.get('dev:' + id) || {}) }; }
export const saveDevice = (store, id, record) => store.set('dev:' + id, record);

// Network and site-wide limits apply only to devices that are not trusted yet.
export async function untrustedBlocked(store, request, secret, now = Date.now()) {
  const [network, site] = await Promise.all([store.get(networkKey(request, secret)), store.get('site:failures')]);
  const until = Math.max(network?.lockedUntil || 0, site?.lockedUntil || 0);
  return until > now ? until : 0;
}
export async function countUntrustedFailure(store, request, secret, now = Date.now()) {
  const key = networkKey(request, secret);
  const network = freshWindow(await store.get(key), now), site = freshWindow(await store.get('site:failures'), now);
  network.count++; site.count++;
  if (network.count >= LIMITS.networkFailures) network.lockedUntil = Math.max(network.lockedUntil || 0, now + HOUR);
  if (site.count >= LIMITS.siteFailures) site.lockedUntil = Math.max(site.lockedUntil || 0, now + HOUR);
  await Promise.all([store.set(key, network), store.set('site:failures', site)]);
}

// ---- Apps Script: every request carries the server key; it is never sent to the browser ----
export async function callScript(payload, { fetcher = fetch, env = process.env, timeoutMs = 20000 } = {}) {
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetcher(scriptUrl(env), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'follow', signal: abort.signal,
      body: JSON.stringify({ ...payload, serverKey: String(env.LEAGUE_SERVER_KEY || '') })
    });
    return { ok: response.ok, data: await response.json() };
  } finally { clearTimeout(timer); }
}
export const setupMessage = env => !String(env.LEAGUE_SERVER_KEY || '')
  ? 'Netlify setup: add the LEAGUE_SERVER_KEY environment variable (the same value as in Apps Script → Script properties), then redeploy.'
  : '';

// ---- Session check for API functions ----
export async function requireSession(request, { store, secret, now = Date.now() } = {}) {
  store ??= await defaultStore();
  secret ??= await resolveSecret(store);
  const session = verify(readCookie(request, 'league_session'), secret, 's', now);
  const device = readDevice(request, secret, now);
  if (!session || !device || session.d !== device.id || !device.trusted) {
    return { ok: false, response: json({ status: 'error', code: 'session', message: 'Sign in again on this device: enter the access code.' }, 401) };
  }
  return { ok: true, session, device, store, secret };
}

// Same-site JSON requests only; credentials never travel in a URL.
export function sameOriginJson(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ status: 'error', message: 'JSON required.' }, 415);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ status: 'error', message: 'Origin not allowed.' }, 403);
  return null;
}

// Wrong Teacher PINs in Manage, Studio and Save Record: five in an hour pause PIN requests from that device for 15 minutes.
export async function pinPaused(store, deviceId, now = Date.now()) {
  const record = await deviceRecord(store, deviceId);
  return record.apiPin.lockedUntil > now ? record.apiPin.lockedUntil : 0;
}
export async function notePinResult(store, deviceId, accepted, now = Date.now()) {
  const record = await deviceRecord(store, deviceId);
  if (accepted) { if (record.apiPin.count) { record.apiPin = { count: 0, windowStart: now, lockedUntil: 0 }; await saveDevice(store, deviceId, record); } return; }
  const pin = freshWindow(record.apiPin, now);
  pin.count++;
  if (pin.count >= LIMITS.apiPinFailures) { pin.lockedUntil = now + LIMITS.apiPinLockMs; pin.count = 0; pin.windowStart = now; }
  record.apiPin = pin;
  await saveDevice(store, deviceId, record);
}
