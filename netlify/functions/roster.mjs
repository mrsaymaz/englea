// The class roster (real student names) lives only in Google Sheets. v12.0.0: it is read and saved for a signed-in
// device (a teacher session) with the Teacher PIN; the request to Apps Script carries the server key.
import { defaultStore, requireSession, sameOriginJson, json, callScript, setupMessage, pinPaused, notePinResult } from '../shared/auth.mjs';

export async function handleRoster(request, fetcher = fetch, deps = {}) {
  const now = deps.now ?? Date.now(), env = deps.env ?? process.env;
  if (request.method !== 'POST') return json({ status: 'error', message: 'Use POST.' }, 405);
  // Only this site's JSON requests are accepted; credentials never enter a URL or cache.
  const refused = sameOriginJson(request);
  if (refused) return refused;
  const store = deps.store ?? await defaultStore();
  const auth = await requireSession(request, { store, secret: deps.secret, now });
  if (!auth.ok) return auth.response;
  let data;
  try { const raw = await request.text(); if (raw.length > 180000) return json({ status: 'error', message: 'Roster too large.' }, 413); data = JSON.parse(raw); }
  catch { return json({ status: 'error', message: 'Invalid request.' }, 400); }
  if (!['ROSTER_GET', 'ROSTER_SAVE'].includes(data?.type) || typeof data.pin !== 'string' || !data.pin.trim() || data.pin.length > 100) return json({ status: 'error', message: 'Enter your Teacher PIN.' }, 400);
  const missing = setupMessage(env);
  if (missing) return json({ status: 'error', code: 'setup', message: missing });
  const paused = await pinPaused(store, auth.device.id, now);
  if (paused) return json({ status: 'error', code: 'pin-paused', message: 'Too many wrong Teacher PINs. Wait 15 minutes, then try again.' }, 429);
  const payload = { type: data.type, pin: data.pin.trim() };
  if (data.type === 'ROSTER_SAVE') { payload.students = data.students; payload.revision = data.revision; }
  try {
    const { ok, data: result } = await callScript(payload, { fetcher, env });
    if (!ok || !['success', 'unauthorized', 'conflict', 'error'].includes(result?.status)) throw Error('Unexpected response');
    if (result.status === 'unauthorized' || result.status === 'success') await notePinResult(store, auth.device.id, result.status === 'success', now);
    if (result.status === 'success' && (!Array.isArray(result.students) || typeof result.revision !== 'string' || !Number.isSafeInteger(result.version))) throw Error('Update Apps Script');
    if (result.status === 'error' && result.message === 'Unknown record type') return json({ status: 'error', message: 'Update your Apps Script code and deploy a New version of the existing web app, then Reload online.' });
    return json(result);
  } catch {
    return json({ status: 'error', message: 'Could not confirm the roster request. Check your connection and the Apps Script deployment, then Reload online before retrying.' }, 502);
  }
}
export default request => handleRoster(request);
