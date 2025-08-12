// Vercel Serverless Function: /api/auth-microsoft-callback.js
import { handleMicrosoftCallback } from '../serverless-helpers/microsoft.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { code, state } = req.query;
    const result = await handleMicrosoftCallback(code, state);
    // Serve HTML that posts message to opener and closes popup, or redirects if no opener
    const jwt = result.jwt;
    const profile = JSON.stringify(result.profile);
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html><html><body><script>
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-success', token: '${jwt}', profile: ${JSON.stringify(profile)} }, window.opener.location.origin);
        window.close();
      } else {
        window.location = '${process.env.FRONTEND_URL || "http://localhost:5173"}?jwt=${encodeURIComponent(jwt)}&profile=${encodeURIComponent(profile)}';
      }
    </script></body></html>`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
