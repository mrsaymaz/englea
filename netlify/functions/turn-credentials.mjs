// Short-lived Cloudflare TURN credentials for the board and the phone. v12.0.0: only a signed-in device (a valid teacher
// session) receives them, at most 60 times an hour per device. The long-lived Cloudflare token stays on the server.
import { defaultStore, requireSession, deviceRecord, saveDevice, json, LIMITS } from '../shared/auth.mjs';

const CLOUDFLARE_TURN_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
const CREDENTIAL_TTL_SECONDS = 6 * 60 * 60;

export async function handleTurn(request, deps = {}) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const now = deps.now ?? Date.now(), env = deps.env ?? process.env, fetcher = deps.fetcher ?? fetch;
  const store = deps.store ?? await defaultStore();
  const auth = await requireSession(request, { store, secret: deps.secret, now });
  if (!auth.ok) return auth.response;
  const record = await deviceRecord(store, auth.device.id);
  if (!record.turn.windowStart || now - record.turn.windowStart >= 3600000) record.turn = { count: 0, windowStart: now };
  if (record.turn.count >= LIMITS.turnPerHour) return json({ error: 'Too many relay requests from this device. Wait a few minutes.' }, 429);
  record.turn.count++;
  await saveDevice(store, auth.device.id, record);

  const keyId = env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = env.CLOUDFLARE_TURN_KEY_API_TOKEN;
  if (!keyId || !apiToken) {
    console.error('Missing Cloudflare TURN environment variables.');
    return json({
      error: 'TURN is not configured on this Netlify site.',
      setup: 'Add CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_KEY_API_TOKEN in Netlify environment variables.'
    }, 503);
  }
  try {
    const response = await fetcher(`${CLOUDFLARE_TURN_API}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS })
    });
    if (!response.ok) {
      const diagnostic = await response.text();
      console.error(`Cloudflare TURN credential request failed (${response.status}):`, diagnostic.slice(0, 500));
      const setup = [401, 403].includes(response.status)
        ? 'Cloudflare rejected the TURN credentials. Check that the Key ID and TURN Key API Token belong to the same active TURN key.'
        : response.status === 404
          ? 'The Cloudflare TURN key was not found. Check the TURN Key ID.'
          : 'Cloudflare could not issue TURN credentials. Check its service status and your account.';
      return json({ error: 'The TURN provider did not issue credentials.', providerStatus: response.status, setup }, 502);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.iceServers) || payload.iceServers.length === 0) {
      console.error('Cloudflare TURN response did not contain iceServers.');
      return json({ error: 'The TURN provider returned an invalid response.' }, 502);
    }
    return json({ iceServers: payload.iceServers, expiresIn: CREDENTIAL_TTL_SECONDS });
  } catch (error) {
    console.error('TURN credential function failed:', error);
    return json({ error: 'Could not contact the TURN provider.' }, 502);
  }
}
export default request => handleTurn(request);
