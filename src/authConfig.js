// MSAL and Teams authentication configuration for both browser and Teams environments.
// Replace placeholder values with your Azure AD app registration details.

export const msalConfig = {
  auth: {
    clientId: "<YOUR_AZURE_AD_CLIENT_ID>", // Azure AD app client ID
    authority: "https://login.microsoftonline.com/<YOUR_TENANT_ID>", // Azure AD tenant
    redirectUri: window.location.origin, // For browser; Teams may override
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const azureScopes = ["User.Read"]; // Example Graph scope

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000"; // Backend auth broker

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
 * - Set environment variables for server: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET.
 * - See README for sample manifest and registration steps.
 */
