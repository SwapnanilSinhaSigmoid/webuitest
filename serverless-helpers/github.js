// GitHub OAuth helpers for Vercel serverless
import querystring from 'querystring';
import jwt from 'jsonwebtoken';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export function getGitHubAuthUrl() {
  const params = querystring.stringify({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
    state: Math.random().toString(36).substring(2)
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function handleGitHubCallback(code, state) {
  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
      state
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('No access_token from GitHub');
  // Get user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${tokenData.access_token}` }
  });
  const profile = await userRes.json();

  // If email is not present, fetch from /user/emails
  if (!profile.email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: { 'Authorization': `token ${tokenData.access_token}` }
    });
    const emails = await emailsRes.json();
    if (Array.isArray(emails)) {
      const primary = emails.find(e => e.primary && e.verified) || emails[0];
      if (primary) profile.email = primary.email;
    }
  }

  // Issue our own JWT
  const jwtToken = jwt.sign({
    provider: 'github',
    login: profile.login,
    name: profile.name,
    avatar_url: profile.avatar_url,
    email: profile.email || ''
  }, JWT_SECRET, { expiresIn: '1h' });
  return { jwt: jwtToken, profile };
}
