// Vercel Serverless Function: /api/auth-google-callback.js
import { handleGoogleCallback } from '../serverless-helpers/google.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { code, state } = req.query;
  const result = await handleGoogleCallback(code, state);
  // Redirect to frontend with JWT and profile in query params
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const redirectUrl = `${frontendUrl}?jwt=${encodeURIComponent(result.jwt)}&profile=${encodeURIComponent(JSON.stringify(result.profile))}`;
  res.writeHead(302, { Location: redirectUrl });
  res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
