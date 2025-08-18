# Teams SSO Configuration Fix Guide

## Error: "Authentication failed. App resource defined in manifest and iframe origin do not match"

This error occurs when the Teams manifest and Azure AD configuration don't align properly.

## Required Azure AD Configuration

### 1. Application ID URI
In your Azure AD app registration, set the **Application ID URI** to:
```
api://79922eb7-096e-46dc-8aa9-af759282e833
```

### 2. Redirect URIs
Add these redirect URIs in the **Authentication** section:
- `http://localhost:5173/` (for development)
- `https://webui-test.vercel.app/api/auth-microsoft-callback` (for production)

### 3. Token Configuration
In **Token configuration**:
- Enable **Access tokens (used for implicit flows)**
- Enable **ID tokens (used for implicit and hybrid flows)**

### 4. API Permissions
Add these permissions:
- `Microsoft Graph > User.Read` (Delegated)

### 5. Expose an API (Important for Teams SSO)
1. Go to **Expose an API**
2. Set Application ID URI to: `api://79922eb7-096e-46dc-8aa9-af759282e833`
3. Add a scope (e.g., "access_as_user") if needed

## Teams Manifest Configuration

Use the appropriate manifest file:

### For Development (localhost:5173)
Use `manifest-dev.json` which points to localhost

### For Production (webui-test.vercel.app)
Use `manifest.json` which points to the Vercel deployment

## Testing Steps

### 1. Local Development
1. Ensure the dev server is running: `npm run dev`
2. Create a Teams app package with `manifest-dev.json`
3. Sideload the app in Teams
4. Test the SSO flow

### 2. Production Testing
1. Deploy to Vercel: `vercel --prod`
2. Create a Teams app package with `manifest.json`
3. Upload to Teams
4. Test the SSO flow

## Common Issues and Solutions

### Issue: "consent_required"
**Solution**: Admin needs to grant consent for the application in Azure AD.

### Issue: "invalid_resource"
**Solution**: Check that the Application ID URI in Azure AD matches the webApplicationInfo.resource in the manifest.

### Issue: "interaction_required"
**Solution**: User needs to complete interactive sign-in. This is normal for first-time users.

### Issue: Teams app won't load
**Solution**: 
1. Check that the domain is in validDomains
2. Ensure the contentUrl is accessible
3. Verify the Azure AD app is properly configured

## Verification Checklist

- [ ] Azure AD Application ID URI: `api://79922eb7-096e-46dc-8aa9-af759282e833`
- [ ] Teams manifest webApplicationInfo.resource: `api://79922eb7-096e-46dc-8aa9-af759282e833`
- [ ] Access tokens and ID tokens enabled in Azure AD
- [ ] Correct redirect URIs configured
- [ ] Domain added to validDomains in manifest
- [ ] App properly sideloaded in Teams

## Debug Tips

1. Check browser console for detailed error messages
2. Use Teams Developer Tools (F12 in Teams desktop app)
3. Verify network requests in the Network tab
4. Check that the token request goes to the correct resource

If you continue having issues, the problem is likely in the Azure AD configuration not matching the Teams manifest exactly.
