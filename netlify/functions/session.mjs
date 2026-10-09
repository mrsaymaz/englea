// Google Sheets saves and loads (sessions, islands, Studio, the Vixar Saga). v12.0.0: a signed-in device only (a teacher
// session), with the Teacher PIN; the request to Apps Script carries the server key.
import { defaultStore, requireSession, sameOriginJson, json, callScript, setupMessage, pinPaused, notePinResult } from '../shared/auth.mjs';

const TYPES = ['TEACHING_GET', 'TEACHING_SAVE', 'ISLAND_GET', 'FULL_SESSION', 'LEADERBOARD_FINAL', 'BATTLE_OUTCOME', 'SAGA_SAVE', 'SAGA_SET', 'SAGA_LINES_SAVE'];
const UPDATE = 'Update Apps Script using GOOGLE-APPS-SCRIPT-v12.0.0.gs, deploy a New version of the existing web app, then save again.';
const trialRow = row => row?.trial === true || /^(Rune|Brand) · /.test(String(row?.type || ''));

export async function handleSession(request, fetcher = fetch, deps = {}) {
  const now = deps.now ?? Date.now(), env = deps.env ?? process.env;
  if (request.method !== 'POST') return json({ status: 'error', message: 'Use POST.' }, 405);
  const refused = sameOriginJson(request);
  if (refused) return refused;
  const store = deps.store ?? await defaultStore();
  const auth = await requireSession(request, { store, secret: deps.secret, now });
  if (!auth.ok) return auth.response;
  let data;
  try { const raw = await request.text(); if (raw.length > 900000) return json({ status: 'error', message: 'Record too large.' }, 413); data = JSON.parse(raw); }
  catch { return json({ status: 'error', message: 'Invalid JSON.' }, 400); }
  if (!TYPES.includes(data?.type) || typeof data.pin !== 'string' || !data.pin.trim() || data.pin.length > 100) return json({ status: 'error', message: 'Enter your Teacher PIN.' }, 400);
  delete data.serverKey;
  const missing = setupMessage(env);
  if (missing) return json({ status: 'error', code: 'setup', message: missing });
  const paused = await pinPaused(store, auth.device.id, now);
  if (paused) return json({ status: 'error', code: 'pin-paused', message: 'Too many wrong Teacher PINs. Wait 15 minutes, then try again.' }, 429);
  const call = payload => callScript(payload, { fetcher, env });
  const noted = async result => { if (result?.status === 'unauthorized' || result?.status === 'success') await notePinResult(store, auth.device.id, result.status === 'success', now); return result; };
  try {
    if (data.type !== 'ISLAND_GET' && (data.islandProgress !== undefined || data.questionLog !== undefined)) {
      const { ok, data: capability } = await call({ type: 'ISLAND_GET', className: data.className, pin: data.pin });
      await noted(capability);
      if (capability?.status === 'unauthorized') return json(capability);
      if (capability?.status === 'error' && capability.code) return json(capability);
      if (!ok || capability?.status !== 'success' || !capability.islandProgress) return json({ status: 'error', message: 'Load islands first. ' + UPDATE });
      const passport = Object.values(data.islandProgress || {}).some(levels => Object.values(levels || {}).some(v => v?.coinPercent !== undefined || v?.hardClear !== undefined));
      if (data.questionLog !== undefined && capability.questionLogVersion !== 1) return json({ status: 'error', message: 'Island Run answers are kept on this phone. ' + UPDATE });
      // v12.0.0: contribution rows carry each student's roster ID; an older script would match them by name only.
      if (data.studentContributions?.everyone !== undefined && capability.contributionIdsVersion !== 1) return json({ status: 'error', message: 'Student contributions are kept on this phone. ' + UPDATE });
      if (Array.isArray(data.navigatorSeals) && data.navigatorSeals.length && capability.navigatorSealsVersion !== 1) return json({ status: 'error', message: 'Navigator seals are kept on this phone. ' + UPDATE });
      if (Array.isArray(data.challengeLog) && data.challengeLog.length && capability.challengeLogVersion !== 1) return json({ status: 'error', message: 'Challenge cards are kept on this phone. ' + UPDATE });
      if (Array.isArray(data.challengeLog) && data.challengeLog.some(row => row?.merge === true || String(row?.type || '').startsWith('Merge')) && capability.sagaVersion !== 1) return json({ status: 'error', message: 'Merge Spell answers are kept on this phone. ' + UPDATE });
      if (Array.isArray(data.challengeLog) && data.challengeLog.some(trialRow) && capability.trialsVersion !== 1) return json({ status: 'error', message: 'True Rune and Scarlet Brand answers are kept on this phone. ' + UPDATE });
      if (passport && capability.passportVersion !== 1) return json({ status: 'error', message: 'Your passport is kept locally. ' + UPDATE });
    }
    if (data.type === 'SAGA_SAVE' && Array.isArray(data.mergeLog) && data.mergeLog.some(trialRow)) {
      // The saga row carries this fight's True Rune or Scarlet Brand answers; an older script would refuse the row.
      const { data: capability } = await call({ type: 'ISLAND_GET', className: data.className, pin: data.pin });
      await noted(capability);
      if (capability?.status === 'success' && capability.trialsVersion !== 1) return json({ status: 'error', message: 'The Vixar Saga is kept on this board and phone. ' + UPDATE });
    }
    const { ok, data: result } = await call(data);
    await noted(result);
    if (!ok || !['success', 'unauthorized', 'conflict', 'error'].includes(result?.status)) throw Error('Invalid response');
    if (result.status === 'success' && (data.type === 'ISLAND_GET' || data.islandProgress !== undefined) && (!result.islandProgress || typeof result.islandProgress !== 'object')) return json({ status: 'error', message: UPDATE });
    if (result.status === 'success' && data.type.startsWith('TEACHING_') && (!result.content || !result.revision)) return json({ status: 'error', message: UPDATE });
    // An older script does not know the Vixar Saga and writes nothing; the stage stays queued on the phone.
    if (result.message === 'Unknown record type' && data.type.startsWith('SAGA_')) result.message = 'The Vixar Saga is kept on this board and phone. ' + UPDATE;
    else if (result.message === 'Unknown record type') result.message = UPDATE;
    return json(result);
  } catch {
    return json({ status: 'error', message: 'Could not confirm the save. Check your connection and retry; records with a session ID will not duplicate.', uncertain: true }, 502);
  }
}
export default request => handleSession(request);
