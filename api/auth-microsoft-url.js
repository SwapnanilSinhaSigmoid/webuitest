// Vercel Serverless Function: /api/auth-microsoft-url.js
import { getMicrosoftAuthUrl } from '../serverless-helpers/microsoft';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const url = getMicrosoftAuthUrl();
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
