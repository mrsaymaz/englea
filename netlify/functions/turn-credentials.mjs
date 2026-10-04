const CLOUDFLARE_TURN_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
const CREDENTIAL_TTL_SECONDS = 6 * 60 * 60;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff'
    }
  });
}

export default async function handler(request) {
  if (request.method !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;

  if (!keyId || !apiToken) {
    console.error('Missing Cloudflare TURN environment variables.');
    return json(503, {
      error: 'TURN is not configured on this Netlify site.',
      setup: 'Add CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_KEY_API_TOKEN in Netlify environment variables.'
    });
  }

  try {
    const response = await fetch(
      `${CLOUDFLARE_TURN_API}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS })
      }
    );

    if (!response.ok) {
      const diagnostic = await response.text();
      console.error(`Cloudflare TURN credential request failed (${response.status}):`, diagnostic.slice(0, 500));
      const setup = [401,403].includes(response.status)
        ? 'Cloudflare rejected the TURN credentials. Check that the Key ID and TURN Key API Token belong to the same active TURN key.'
        : response.status === 404
          ? 'The Cloudflare TURN key was not found. Check the TURN Key ID.'
          : 'Cloudflare could not issue TURN credentials. Check its service status and your account.';
      return json(502, { error: 'The TURN provider did not issue credentials.', providerStatus:response.status, setup });
    }

    const payload = await response.json();
    if (!Array.isArray(payload.iceServers) || payload.iceServers.length === 0) {
      console.error('Cloudflare TURN response did not contain iceServers.');
      return json(502, { error: 'The TURN provider returned an invalid response.' });
    }

    return json(200, {
      iceServers: payload.iceServers,
      expiresIn: CREDENTIAL_TTL_SECONDS
    });
  } catch (error) {
    console.error('TURN credential function failed:', error);
    return json(502, { error: 'Could not contact the TURN provider.' });
  }
}
