// Simple Express server to broker OAuth for Google/GitHub and issue a session JWT.
// This keeps client secrets off the frontend. For production, harden security (HTTPS, CSRF, nonce, state validation).

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Allow localhost:* origins for dev, using a function for compatibility
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^https:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Utility: build redirect URI based on provider
function baseUrl(req) { return `${req.protocol}://${req.get('host')}`; }

// STATE store (in-memory for demo)
const stateStore = new Set();
function newState() { const s = Math.random().toString(36).slice(2); stateStore.add(s); return s; }
function useStateValue(s) { if (stateStore.has(s)) { stateStore.delete(s); return true; } return false; }

// Google OAuth endpoints
app.get('/auth/google/url', (req, res) => {
  const state = newState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${baseUrl(req)}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
    prompt: 'consent'
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!useStateValue(state)) return res.status(400).send('Invalid state');
  try {
    const tokenResp = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${baseUrl(req)}/auth/google/callback`,
      grant_type: 'authorization_code'
    }));
    const idToken = tokenResp.data.id_token;
    // Decode minimal fields
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    const sessionJwt = jwt.sign({ sub: payload.sub, email: payload.email, name: payload.name, provider: 'google' }, JWT_SECRET, { expiresIn: '1h' });
    res.send(`<script>window.opener.postMessage({ type: 'oauth-success', token: '${sessionJwt}' }, '*');window.close();</script>`);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.send(`<script>window.opener.postMessage({ type: 'oauth-error', error: 'Google auth failed' }, '*');window.close();</script>`);
  }
});

// GitHub OAuth
app.get('/auth/github/url', (req, res) => {
  const state = newState();
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: `${baseUrl(req)}/auth/github/callback`,
    scope: 'read:user user:email',
    state
  });
  res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!useStateValue(state)) return res.status(400).send('Invalid state');
  try {
    const tokenResp = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID || '',
      client_secret: process.env.GITHUB_CLIENT_SECRET || '',
      code,
      redirect_uri: `${baseUrl(req)}/auth/github/callback`,
      state
    }, { headers: { Accept: 'application/json' } });
    const accessToken = tokenResp.data.access_token;
    const user = await axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sample-app' } });
    const emails = await axios.get('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sample-app' } });
    const primaryEmail = emails.data.find(e => e.primary) || emails.data[0];
    const sessionJwt = jwt.sign({ sub: user.data.id, email: primaryEmail.email, name: user.data.name || user.data.login, provider: 'github' }, JWT_SECRET, { expiresIn: '1h' });
    res.send(`<script>window.opener.postMessage({ type: 'oauth-success', token: '${sessionJwt}' }, '*');window.close();</script>`);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.send(`<script>window.opener.postMessage({ type: 'oauth-error', error: 'GitHub auth failed' }, '*');window.close();</script>`);
  }
});

// Simple userinfo endpoint (validate JWT)
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Serve static (optional for build deploy)
const distDir = path.join(__dirname, 'dist');
const rootIndex = path.join(__dirname, 'index.html');
const distIndex = path.join(distDir, 'index.html');

// Serve built assets if they exist
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Simple request logger (dev)
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

// SPA fallback: prefer dist/index.html, else fall back to root index.html used by Vite dev (must run vite separately)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/auth/') && !req.path.includes('.')) {
    if (fs.existsSync(distIndex)) {
      return res.sendFile(distIndex);
    }
    if (fs.existsSync(rootIndex)) {
      return res.sendFile(rootIndex);
    }
  }
  next();
});

app.listen(PORT, () => console.log(`Auth broker server listening on :${PORT}`));
