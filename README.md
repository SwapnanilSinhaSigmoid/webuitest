
# React SSO Sample: Teams & Browser

This sample demonstrates a React app that detects if it is running inside Microsoft Teams or a standard browser, and adapts its SSO options and UI accordingly.

## Features
- **Environment Detection:** Uses Microsoft Teams JavaScript SDK to detect Teams.
- **SSO Options:**
	- **Browser:** Microsoft/Azure AD, Google, GitHub SSO options.
	- **Teams:** Only Microsoft/Azure AD SSO (via Teams SSO API).
- **Authentication:** Uses MSAL.js for browser, Teams SSO API for Teams.
- **Responsive UI:** React hooks and CSS media queries, Fluent UI components.
- **User Feedback:** Clear states for signed in/out, errors, and fallback.

## Quickstart

### 1. Prerequisites
- Node.js & npm
- Azure AD tenant (for Microsoft SSO)

### 2. Setup
```bash
npm install
cp .env.example .env   # create and fill secrets (see below)
npm run dev            # starts Vite on 5173
node server.js         # starts auth broker on 4000
```

### 3. Azure AD App Registration
- Register an app in Azure AD (Entra ID)
- **Set Application ID URI**: `api://79922eb7-096e-46dc-8aa9-af759282e833`
- Add redirect URIs:
	- `http://localhost:5173/` (for local development)
	- `https://webui-test.vercel.app/api/auth-microsoft-callback` (for production)
- Add API permissions: `Microsoft Graph > User.Read`
- For Teams SSO: Enable **Access tokens** and **ID tokens** in Authentication
- Update `src/authConfig.js` with your `clientId` and `tenantId`

#### Sample manifest.json for Teams
```json
{
	"webApplicationInfo": {
		"id": "<YOUR_AZURE_AD_CLIENT_ID>",
		"resource": "api://<YOUR_AZURE_AD_CLIENT_ID>"
	},
	"validDomains": ["localhost", "<your-domain>"]
}
```

### 4. Testing in Teams
- Use [Microsoft 365 Agents Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) for local debugging.
- Sideload the app in Teams with the manifest above.

### 5. Customization
- UI adapts for Teams (Fluent UI, background) and browser.
- See `src/App.jsx`, `src/SSOSelector.jsx`, and `src/authConfig.js` for logic and comments.

## Notes
- Real Google & GitHub OAuth flows brokered through `server.js` (popup posts JWT back).
- Provide `.env` values:
	- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
	- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
	- JWT_SECRET (strong value)
	- (Optional) PORT, VITE_API_BASE (defaults to http://localhost:4000)
- Teams SSO requires correct manifest and Azure AD setup.

---
MIT License
