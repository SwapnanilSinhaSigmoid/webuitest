
import React, { useEffect, useState, useCallback } from "react";
import { msalConfig, API_BASE, azureScopes } from "./authConfig";
import SSOSelector from "./SSOSelector";
import EmailModal from "./EmailModal";
import ErrorBoundary from "./ErrorBoundary";
import { PublicClientApplication } from "@azure/msal-browser";
import { initializeIcons, Stack, Text, Spinner, MessageBar, MessageBarType } from "@fluentui/react";
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Teams SDK is loaded dynamically to avoid errors in browser
let microsoftTeams = null;

initializeIcons();

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function LandingPage({ user, provider, onSignOut }) {
  // Fullscreen landing page after login
  // Prefer name, fallback to login for GitHub
  const displayName = user?.name || user?.login || user?.username || '';
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f3f2f1 0%, #e6e6e6 100%)',
    }}>
      <Stack tokens={{ childrenGap: 24 }} horizontalAlign="center" style={{ maxWidth: 480, width: '100%' }}>
        <Text variant="xxLarge">Welcome, {displayName}!</Text>
        <Text variant="large">You signed in with: {provider?.name}</Text>
        <Text variant="medium">Email: {user?.email || user?.userName}</Text>
        {user?.login && !user?.name && (
          <Text variant="medium">GitHub login: {user.login}</Text>
        )}
        <a href="#signout" onClick={(e) => { e.preventDefault(); onSignOut(); }} style={{ color: '#0078d4', fontWeight: 500, fontSize: 18 }}>Sign out</a>
      </Stack>
    </div>
  );
}

function AuthShell() {
  const [isInTeams, setIsInTeams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState({ status: "signedout", error: null, user: null });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const windowSize = useWindowSize();
  const navigate = useNavigate();

  // Detect Teams environment
  useEffect(() => {
    async function detectTeams() {
      try {
        // Check if we're already in an iframe (Teams)
        const inIframe = window.self !== window.top;
        
        if (inIframe) {
          try {
            microsoftTeams = await import("@microsoft/teams-js");
            await microsoftTeams.app.initialize();
            const context = await microsoftTeams.app.getContext();
            console.log("Teams context:", context);
            setIsInTeams(true);
          } catch (teamsError) {
            console.warn("Teams initialization failed:", teamsError);
            setIsInTeams(false);
          }
        } else {
          setIsInTeams(false);
        }
      } catch (error) {
        console.warn("Teams detection failed:", error);
        setIsInTeams(false);
      } finally {
        setLoading(false);
      }
    }
    detectTeams();

    // Handle Google or GitHub login redirect with JWT/profile in query params
    const params = new URLSearchParams(window.location.search);
    if (params.has('jwt') && params.has('profile')) {
      try {
        const profile = JSON.parse(decodeURIComponent(params.get('profile')));
        // Detect provider from profile fields
        let provider = null;
        let user = {};
        if (profile.login) {
          // GitHub
          provider = { id: 'github', name: 'GitHub' };
          user = { name: profile.name || profile.login, email: profile.email || '', login: profile.login };
        } else if (profile.email && profile.name) {
          // Google
          provider = { id: 'google', name: 'Google' };
          user = { name: profile.name, email: profile.email };
        }
        setAuthState({ status: 'signedin', error: null, user });
        setSelectedProvider(provider);
        // Remove query params and redirect to /app
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/app', { replace: true });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // MSAL instance with proper initialization
  const [msalInstance, setMsalInstance] = useState(null);
  
  useEffect(() => {
    const initMsal = async () => {
      try {
        const instance = new PublicClientApplication(msalConfig);
        await instance.initialize();
        setMsalInstance(instance);
      } catch (error) {
        console.error("MSAL initialization failed:", error);
        setAuthState({ status: "error", error: "Failed to initialize authentication", user: null });
      }
    };
    initMsal();
  }, []);

  // Handle SSO selection
  const handleSSOSelect = useCallback(async (provider) => {
    setSelectedProvider(provider);
    setAuthState({ status: "loading", error: null, user: null });
    
    if (provider.id === "microsoft") {
      if (!msalInstance) {
        setAuthState({ status: "error", error: "Authentication not initialized", user: null });
        return;
      }
      
      if (isInTeams) {
        // For Teams, use Teams SSO API instead of MSAL
        try {
          if (!microsoftTeams) {
            throw new Error("Teams SDK not available");
          }
          
          // First try to get a token silently
          const token = await microsoftTeams.authentication.getAuthToken({
            resources: ["https://graph.microsoft.com"],
            silent: false
          });
          
          // Decode the token to get user info
          const decoded = jwtDecode(token);
          const userInfo = {
            username: decoded.preferred_username || decoded.upn || decoded.email,
            name: decoded.name || decoded.given_name + " " + decoded.family_name,
            email: decoded.preferred_username || decoded.upn || decoded.email
          };
          
          setAuthState({ status: "signedin", error: null, user: userInfo });
          navigate('/app');
        } catch (teamsError) {
          console.error("Teams SSO error:", teamsError);
          // Fallback to MSAL if Teams SSO fails
          if (msalInstance) {
            try {
              const loginRequest = {
                scopes: azureScopes,
                prompt: "select_account"
              };
              
              const loginResponse = await msalInstance.loginPopup(loginRequest);
              setAuthState({ status: "signedin", error: null, user: loginResponse.account });
              navigate('/app');
            } catch (msalError) {
              setAuthState({ status: "error", error: "Authentication failed: " + (teamsError.message || msalError.message), user: null });
            }
          } else {
            setAuthState({ status: "error", error: "Teams authentication failed: " + teamsError.message, user: null });
          }
        }
      } else {
        // Use MSAL for browser with popup to avoid iframe issues
        try {
          const loginRequest = {
            scopes: azureScopes,
            prompt: "select_account"
          };
          
          const loginResponse = await msalInstance.loginPopup(loginRequest);
          setAuthState({ status: "signedin", error: null, user: loginResponse.account });
          navigate('/app');
        } catch (err) {
          console.error("Browser MSAL error:", err);
          setAuthState({ status: "error", error: err.message || "Authentication failed", user: null });
        }
      }
    } else if (provider.id === "google") {
      // Real Google OAuth via Vercel serverless
      try {
        const urlResp = await fetch(`${API_BASE}/auth-google-url`).then(r => r.json());
        const popup = window.open(urlResp.url, 'google-oauth', 'width=600,height=700');
        const handler = (event) => {
          if (event.data?.type === 'oauth-success') {
            window.removeEventListener('message', handler);
            try {
              const decoded = jwtDecode(event.data.token);
              setAuthState({ status: 'signedin', error: null, user: { name: decoded.name, email: decoded.email } });
              navigate('/app');
            } catch (e) {
              setAuthState({ status: 'error', error: 'Token decode failed', user: null });
            }
          } else if (event.data?.type === 'oauth-error') {
            window.removeEventListener('message', handler);
            setAuthState({ status: 'error', error: event.data.error, user: null });
          }
        };
        window.addEventListener('message', handler);
        const checkClosed = setInterval(() => { if (popup?.closed) { clearInterval(checkClosed); window.removeEventListener('message', handler); setAuthState({ status: 'signedout', error: null, user: null }); } }, 500);
      } catch (e) {
        setAuthState({ status: 'error', error: e.message, user: null });
      }
    } else if (provider.id === "github") {
      // Real GitHub OAuth via Vercel serverless
      try {
        const urlResp = await fetch(`${API_BASE}/auth-github-url`).then(r => r.json());
        const popup = window.open(urlResp.url, 'github-oauth', 'width=600,height=700');
        const handler = (event) => {
          if (event.data?.type === 'oauth-success') {
            window.removeEventListener('message', handler);
            try {
              const decoded = jwtDecode(event.data.token);
              setAuthState({ status: 'signedin', error: null, user: { name: decoded.name, email: decoded.email } });
              navigate('/app');
            } catch (e) {
              setAuthState({ status: 'error', error: 'Token decode failed', user: null });
            }
          } else if (event.data?.type === 'oauth-error') {
            window.removeEventListener('message', handler);
            setAuthState({ status: 'error', error: event.data.error, user: null });
          }
        };
        window.addEventListener('message', handler);
        const checkClosed = setInterval(() => { if (popup?.closed) { clearInterval(checkClosed); window.removeEventListener('message', handler); setAuthState({ status: 'signedout', error: null, user: null }); } }, 500);
      } catch (e) {
        setAuthState({ status: 'error', error: e.message, user: null });
      }
    } else if (provider.id === "email") {
      // Open email modal instead of browser prompt for Teams compatibility
      setIsEmailModalOpen(true);
      setAuthState({ status: "signedout", error: null, user: null }); // Reset loading state
    } else {
      // Simulate other SSO providers (fallback)
      setTimeout(() => {
        setAuthState({ status: "signedin", error: null, user: { name: provider.name + " User", email: provider.id + "@example.com" } });
        navigate('/app');
      }, 1000);
    }
  }, [isInTeams, msalInstance, navigate]);

  // Handle redirect response for browser authentication only
  useEffect(() => {
    if (!isInTeams && msalInstance) {
      msalInstance.handleRedirectPromise().then((response) => {
        if (response) {
          setAuthState({ status: "signedin", error: null, user: response.account });
          navigate('/app');
        }
      }).catch((err) => {
        console.error("Redirect response error:", err);
        setAuthState({ status: "error", error: err.message || "Authentication failed", user: null });
      });
    }
  }, [isInTeams, msalInstance, navigate]);

  // Sign out logic
  const handleSignOut = useCallback(() => {
    setAuthState({ status: "signedout", error: null, user: null });
    setSelectedProvider(null);
    
    if (selectedProvider?.id === "microsoft") {
      if (!isInTeams && msalInstance) {
        msalInstance.logoutPopup().catch(console.error);
      }
      // For Teams, just clear local state - Teams will handle SSO session
    }
    
    navigate('/');
  }, [selectedProvider, isInTeams, msalInstance, navigate]);

  // Email modal handlers
  const handleEmailSubmit = useCallback((email) => {
    setIsEmailModalOpen(false);
    if (email && email.includes("@")) {
      setAuthState({ status: "loading", error: null, user: null });
      setTimeout(() => {
        setAuthState({ status: "signedin", error: null, user: { name: "Email User", email } });
        navigate('/app');
      }, 800);
    } else {
      setAuthState({ status: "error", error: "Please enter a valid email address.", user: null });
    }
  }, [navigate]);

  const handleEmailCancel = useCallback(() => {
    setIsEmailModalOpen(false);
    setSelectedProvider(null);
  }, []);

  // Responsive style
  // Center login card in viewport
  const containerStyle = authState.status === "signedin"
    ? { display: 'none' }
    : {
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#222',
      };

  return (
    <>
      <div style={containerStyle}>
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 32px #0002',
          padding: windowSize.width < 600 ? 16 : 40,
          maxWidth: 700,
          width: '100%',
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Stack tokens={{ childrenGap: 24 }} horizontalAlign="center" style={{ width: '100%' }}>
            <Text variant="xxLarge" block>
              {isInTeams ? "Teams SSO Sample" : "Browser SSO Sample"}
            </Text>
            {loading ? (
              <Spinner label="Detecting environment..." />
            ) : authState.status === "signedin" ? null : (
              <>
                {authState.status === "error" && (
                  <MessageBar messageBarType={MessageBarType.error} isMultiline={false} onDismiss={() => setAuthState({ ...authState, error: null })}>
                    {authState.error}
                  </MessageBar>
                )}
                <SSOSelector isInTeams={isInTeams} onSelect={handleSSOSelect} />
              </>
            )}
          </Stack>
        </div>
      </div>
      {authState.status === "signedin" && (
        <LandingPage user={authState.user} provider={selectedProvider} onSignOut={handleSignOut} />
      )}
      <EmailModal 
        isOpen={isEmailModalOpen}
        onSubmit={handleEmailSubmit}
        onCancel={handleEmailCancel}
      />
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    document.title = 'Sample SSO';
  }, []);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AuthShell />} />
          <Route path="/app" element={<AuthShell />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * Conditional logic:
 * - Uses Teams SDK to detect environment and restricts SSO options in Teams.
 * - Uses MSAL for browser auth (popup) and Teams SSO API inside Teams.
 * - Google/GitHub/Microsoft real OAuth via Vercel serverless API endpoints.
 * - Email signup simulated for demo.
 * - Landing page route /app after successful login.
 *
 * Deployment:
 * - For local dev, use Vite dev server and Vercel CLI for API routes. For prod, deploy to Vercel.
 * - Configure Azure AD + Teams manifest as documented; add Vercel domain to validDomains.
 */
