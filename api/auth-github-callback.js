// Vercel Serverless Function: /api/auth-github-callback.js
import { handleGitHubCallback } from '../serverless-helpers/github.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { code, state } = req.query;
    const result = await handleGitHubCallback(code, state);
    // Set cookie or return JWT as needed
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
