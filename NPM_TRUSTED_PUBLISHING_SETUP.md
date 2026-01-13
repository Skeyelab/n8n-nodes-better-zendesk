# NPM Trusted Publishing Setup (OIDC)

This repository uses **npm Trusted Publishing** (OIDC) for secure, tokenless authentication. This is the recommended method by npm and eliminates the need to manage long-lived tokens.

## Setup Instructions

### 1. Enable Trusted Publishing in npm

1. Go to your npm package settings:
   - Visit: https://www.npmjs.com/package/n8n-nodes-better-zendesk/settings
   - Or go to: https://www.npmjs.com/settings/[your-username]/packages

2. Navigate to "Trusted Publishing" section

3. Click "Add GitHub Actions workflow"

4. Configure the trusted publisher:
   - **GitHub Organization/User**: `Skeyelab` (or your GitHub username)
   - **Repository**: `n8n-nodes-better-zendesk`
   - **Workflow filename**: `.github/workflows/publish.yml`
   - **Environment name**: (leave empty for default, or specify if using environments)

5. Click "Create" or "Add"

### 2. Verify Setup

The workflow is already configured to use OIDC. It includes:
- `id-token: write` permission (required for OIDC)
- `setup-node@v4` with `registry-url` (automatically uses OIDC)
- No `NPM_TOKEN` secret needed

### 3. How It Works

- GitHub Actions authenticates to npm using OIDC
- No tokens are stored or managed
- Authentication is handled automatically by `setup-node@v4`
- More secure than granular access tokens

## Benefits

✅ **More Secure** - No long-lived tokens to manage or rotate
✅ **No Token Management** - Authentication handled automatically
✅ **Recommended by npm** - The official recommended approach
✅ **No Secrets Required** - Nothing to store in GitHub Secrets

## References

- [npm Trusted Publishing Documentation](https://docs.npmjs.com/about-trusted-publishing)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
