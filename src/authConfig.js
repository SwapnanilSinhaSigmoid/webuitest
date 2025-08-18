// MSAL and Teams authentication configuration for both browser and Teams environments.
// Replace placeholder values with your Azure AD app registration details.

// Determine the correct redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Always use root path for redirect to avoid complications
    return `${origin}/`;
  }
  // Default fallback
  return "https://webui-test.vercel.app/";
};

export const msalConfig = {
  auth: {
  clientId: "79922eb7-096e-46dc-8aa9-af759282e833", // Azure AD app client ID (matches Azure AD and Teams manifest)
  authority: "https://login.microsoftonline.com/common", // Azure AD tenant (multi-tenant)
  redirectUri: getRedirectUri(), // Environment-aware redirect URI
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false, // Disable native broker for Teams compatibility
    loggerOptions: {
      logLevel: 1, // Error level logging
    }
  }
};

export const azureScopes = ["User.Read"]; // Example Graph scope

export const API_BASE = "/api"; // Vercel serverless API base

// SSO Providers configuration for browser

export const SSO_PROVIDERS = [
  {
    id: "microsoft",
    name: "Microsoft/Azure AD",
    logo: "/assets/microsoft.svg",
  },
  {
    id: "google",
    name: "Google",
    logo: "/assets/google.svg",
  },
  {
    id: "github",
    name: "GitHub",
    logo: "/assets/github.svg",
  },
  {
    id: "email",
    name: "Sign up with Email",
    logo: "/assets/email.svg",
  },
];

// Only Microsoft/Azure AD SSO is available in Teams
export const TEAMS_SSO_PROVIDER = SSO_PROVIDERS[0];

/**
 * Deployment Considerations:
 * - Register your app in Azure AD and configure redirect URIs for both browser and Teams.
 * - For Teams, ensure the manifest.json includes the correct webApplicationInfo and validDomains.
 * - Set environment variables for Vercel: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, MS_CLIENT_ID, MS_CLIENT_SECRET, JWT_SECRET, and all redirect URIs.
 * - For Vercel, backend routes are in /api/*. See README for serverless deployment steps.
 */
