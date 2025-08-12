// Google OAuth helpers for Vercel serverless
import querystring from 'querystring';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export function getGoogleAuthUrl() {
  const params = querystring.stringify({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: Math.random().toString(36).substring(2)
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleGoogleCallback(code, state) {
  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: querystring.stringify({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.id_token) throw new Error('No id_token from Google');
  // Decode id_token
  const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
  // Issue our own JWT
  const jwtToken = jwt.sign({
    provider: 'google',
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  }, JWT_SECRET, { expiresIn: '1h' });
  return { jwt: jwtToken, profile: payload };
}
