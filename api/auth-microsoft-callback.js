// Vercel Serverless Function: /api/auth-microsoft-callback.js
// This handles MSAL redirect callbacks for Microsoft authentication

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get the query parameters from the authorization response
    const { code, state, error, error_description } = req.query;
    
    // Build the redirect URL back to the main app with the auth response
    const baseUrl = process.env.FRONTEND_URL || "https://webui-test.vercel.app";
    const queryParams = new URLSearchParams();
    
    if (code) queryParams.set('code', code);
    if (state) queryParams.set('state', state);
    if (error) queryParams.set('error', error);
    if (error_description) queryParams.set('error_description', error_description);
    
    const redirectUrl = `${baseUrl}/?${queryParams.toString()}`;
    
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html>
<head>
    <title>Microsoft Auth Callback</title>
    <meta http-equiv="refresh" content="0; url=${redirectUrl}">
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Authentication successful!</h2>
        <p>Redirecting you back to the application...</p>
        <p>If you're not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
    </div>
    <script>
        // Immediate redirect
        window.location.replace('${redirectUrl}');
    </script>
</body>
</html>`);
  } catch (err) {
    console.error('Microsoft callback error:', err);
    const errorUrl = `${process.env.FRONTEND_URL || "https://webui-test.vercel.app"}/?error=callback_failed&error_description=${encodeURIComponent(err.message)}`;
    res.redirect(302, errorUrl);
  }
}
