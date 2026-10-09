// v12.0.0 · Teacher access, decided on the server. Time is evaluated on the server; the browser's clock, timezone and
// storage are ignored, and so is any lockout a browser could clear.
//   GET    → {serverNow, session:{active, expiresAt}, device:{trusted}}
//   POST   {code}           → granted (a trusted device), pin (a new device: the Teacher PIN comes next), invalid, locked
//   POST   {challenge, pin} → granted (the device is now trusted for 180 days), pin-invalid, locked, expired
//   DELETE                  → signs this device out (?forget=1 also forgets the device)
import {
  defaultStore, resolveSecret, json, readDevice, newDevice, deviceCookie, sessionCookie, cookie, sign, verify,
  readCookie, deviceRecord, saveDevice, untrustedBlocked, countUntrustedFailure, callScript, setupMessage,
  LIMITS, LOCK_MS, CHALLENGE_TTL_MS, DEVICE_TTL_MS, sameOriginJson
} from '../shared/auth.mjs';

export function codesAt(epoch) {
  const trt = new Date(epoch + 3 * 60 * 60 * 1000);
  const hhmm = String(trt.getUTCHours()).padStart(2, '0') + String(trt.getUTCMinutes()).padStart(2, '0');
  const shift = n => [...hhmm].map(d => (Number(d) + n + 10) % 10).join('');
  return { normal: shift(1), master: shift(-1) };
}

function sessionInfo(request, secret, device, now) {
  const session = verify(readCookie(request, 'league_session'), secret, 's', now);
  const active = Boolean(session && device && session.d === device.id && device.trusted);
  return { active, expiresAt: active ? session.exp : 0 };
}

async function checkPin(pin, deps) {
  const missing = setupMessage(deps.env);
  if (missing) return { status: 'setup', message: missing };
  try {
    const { ok, data } = await callScript({ type: 'AUTH_CHECK', pin }, deps);
    if (data?.status === 'unauthorized') return { status: 'wrong' };
    if (ok && data?.status === 'success' && data.authVersion === 1) return { status: 'ok' };
    if (data?.message === 'Unknown record type') return { status: 'setup', message: 'Update Apps Script using GOOGLE-APPS-SCRIPT-v12.0.0.gs and deploy a New version of the existing web app, then sign in again.' };
    return { status: 'setup', message: String(data?.message || 'Apps Script did not confirm the Teacher PIN.') };
  } catch {
    return { status: 'offline', message: 'Google Sheets could not be reached to check the Teacher PIN. Check the connection and try again.' };
  }
}

export async function handleAt(request, deps = {}) {
  const now = deps.now ?? Date.now();
  const env = deps.env ?? process.env;
  const store = deps.store ?? await defaultStore();
  let secret;
  try { secret = deps.secret ?? await resolveSecret(store, env); }
  catch { return json({ error: 'Sign-in is not available: the session store could not be reached.' }, 503); }
  const cookies = [];
  let device = readDevice(request, secret, now);
  if (!device) { device = newDevice(now); cookies.push(deviceCookie(request, device, secret)); }
  const reply = (body, status = 200) => json({ serverNow: now, ...body }, status, cookies);

  if (request.method === 'GET') return reply({ session: sessionInfo(request, secret, device, now), device: { trusted: Boolean(device.trusted) } });
  if (request.method === 'DELETE') {
    cookies.push(cookie(request, 'league_session', '', 0));
    if (new URL(request.url).searchParams.get('forget') === '1') { device = newDevice(now); cookies.push(deviceCookie(request, device, secret)); }
    return reply({ session: { active: false, expiresAt: 0 }, device: { trusted: Boolean(device.trusted) } });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const refused = sameOriginJson(request);
  if (refused) return refused;
  let body = {};
  try { body = await request.json(); } catch {}

  const record = await deviceRecord(store, device.id);
  const untrusted = !device.trusted;
  if (untrusted) {
    const until = await untrustedBlocked(store, request, secret, now);
    if (until) return reply({ kind: 'locked', scope: 'network', until, unlock: false });
  }
  const fail = async () => { await saveDevice(store, device.id, record); if (untrusted) await countUntrustedFailure(store, request, secret, now); };

  // Step 2 on a new device: the Teacher PIN, within five minutes of a correct time code.
  if (body.challenge !== undefined) {
    const challenge = verify(String(body.challenge || ''), secret, 'c', now);
    if (!challenge || challenge.d !== device.id) return reply({ kind: 'expired' });
    if (record.pinLockedUntil > now) return reply({ kind: 'locked', scope: 'pin', until: record.pinLockedUntil, unlock: false });
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
    if (!pin || pin.length > 100) return reply({ kind: 'pin-invalid', remaining: Math.max(0, LIMITS.pinFailures - record.pinFailures) });
    const result = await checkPin(pin, { ...deps, env });
    if (result.status === 'wrong') {
      record.pinFailures++;
      if (record.pinFailures >= LIMITS.pinFailures) { record.pinLockedUntil = now + LOCK_MS; record.pinFailures = 0; }
      await fail();
      return record.pinLockedUntil > now
        ? reply({ kind: 'locked', scope: 'pin', until: record.pinLockedUntil, unlock: false })
        : reply({ kind: 'pin-invalid', remaining: LIMITS.pinFailures - record.pinFailures });
    }
    if (result.status !== 'ok') return reply({ kind: 'error', message: result.message });
    record.pinFailures = 0;
    await saveDevice(store, device.id, record);
    device = { ...device, trusted: true, iat: now, exp: now + DEVICE_TTL_MS };
    cookies.push(deviceCookie(request, device, secret));
    const { session, header } = sessionCookie(request, device, challenge.k, secret, now);
    cookies.push(header);
    return reply({ kind: 'granted', expiresAt: session.exp, trusted: true });
  }

  // Step 1: the time code of the current minute (Turkey time). The unlock code also ends a lock.
  const code = typeof body.code === 'string' && /^\d{4}$/.test(body.code) ? body.code : '';
  const codes = codesAt(now);
  const kind = code && code === codes.master ? 'master' : code && code === codes.normal ? 'normal' : 'invalid';
  if (record.hardUntil > now) return reply({ kind: 'locked', scope: 'device', until: record.hardUntil, unlock: false });
  if (record.lockedUntil > now) {
    if (kind !== 'master') {
      if (kind === 'invalid') {
        record.unlockFailures++;
        if (record.unlockFailures >= LIMITS.unlockFailures) record.hardUntil = record.lockedUntil;
        await fail();
      }
      return reply({ kind: 'locked', scope: 'device', until: record.lockedUntil, unlock: record.hardUntil <= now });
    }
  } else if (record.lockedUntil) {
    record.lockedUntil = 0; record.codeFailures = 0; record.unlockFailures = 0;
  }
  if (kind === 'invalid') {
    record.codeFailures++;
    if (record.codeFailures >= LIMITS.codeFailures) { record.lockedUntil = now + LOCK_MS; record.codeFailures = 0; record.unlockFailures = 0; }
    await fail();
    return record.lockedUntil > now
      ? reply({ kind: 'locked', scope: 'device', until: record.lockedUntil, unlock: true })
      : reply({ kind: 'invalid', remaining: LIMITS.codeFailures - record.codeFailures });
  }
  record.codeFailures = 0; record.lockedUntil = 0; record.unlockFailures = 0; record.hardUntil = 0;
  await saveDevice(store, device.id, record);
  if (!device.trusted) {
    const challenge = sign({ t: 'c', d: device.id, k: kind, iat: now, exp: now + CHALLENGE_TTL_MS }, secret);
    return reply({ kind: 'pin', challenge });
  }
  const { session, header } = sessionCookie(request, device, kind, secret, now);
  cookies.push(header);
  return reply({ kind: 'granted', expiresAt: session.exp, trusted: true });
}
export default request => handleAt(request);
