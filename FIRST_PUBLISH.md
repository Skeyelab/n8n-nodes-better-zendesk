# First-Time Package Publishing

Since the package doesn't exist on npm yet, you need to publish it manually the first time. After the first publish, you can set up trusted publishing for automated releases.

## Steps to Publish for the First Time

### 1. Login to npm

```bash
npm login
```

This will prompt you for:
- Username
- Password
- Email (if not already set)
- One-time password (if 2FA is enabled)

### 2. Verify you're logged in

```bash
npm whoami
```

### 3. Build the package

```bash
yarn build
```

### 4. Publish to npm

```bash
npm publish --access public
```

The `--access public` flag is needed for scoped packages (packages starting with `@`), but it's safe to use for all packages.

### 5. Verify the package exists

Check: https://www.npmjs.com/package/n8n-nodes-better-zendesk

## After First Publish

Once the package exists on npm, you can:

1. **Set up Trusted Publishing** (see `NPM_TRUSTED_PUBLISHING_SETUP.md`)
2. Future releases will be automated via GitHub Actions

## Notes

- Make sure the `version` in `package.json` is appropriate (currently `0.1.0`)
- The package name must be available on npm
- After first publish, use semantic-release for versioning and automated releases
