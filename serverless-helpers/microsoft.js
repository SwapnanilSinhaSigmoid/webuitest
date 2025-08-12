// Microsoft OAuth helpers for Vercel serverless
import querystring from 'querystring';
import jwt from 'jsonwebtoken';

const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const MS_REDIRECT_URI = process.env.MS_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export function getMicrosoftAuthUrl() {
  const params = querystring.stringify({
    client_id: MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    response_mode: 'query',
    scope: 'openid profile email',
    state: Math.random().toString(36).substring(2)
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export async function handleMicrosoftCallback(code, state) {
  // Exchange code for tokens
  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: querystring.stringify({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      code,
      redirect_uri: MS_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.id_token) throw new Error('No id_token from Microsoft');
  // Decode id_token
  const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
  // Issue our own JWT
  const jwtToken = jwt.sign({
    provider: 'microsoft',
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  }, JWT_SECRET, { expiresIn: '1h' });
  return { jwt: jwtToken, profile: payload };
}
