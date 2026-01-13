# Copilot Instructions for n8n-nodes-better-zendesk

## Project Overview

This is an n8n community node for Zendesk Support API with enhanced error visibility. The node surfaces selected response headers (rate-limit headers and `x-zendesk-request-id`) when API calls fail, making debugging and troubleshooting easier.

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 22
- **Package Manager**: Yarn
- **Testing Framework**: Vitest
- **Linting**: ESLint (using @n8n/node-cli configuration)
- **Build Tool**: n8n-node CLI

## Build and Test Commands

```bash
# Install dependencies
yarn install --frozen-lockfile

# Lint code
yarn lint
yarn lint:fix

# Run tests
yarn test
yarn test:ui  # Run with UI

# Build the project
yarn build
yarn build:watch  # Watch mode for development

# Development mode
yarn dev
```

## Project Structure

```
.
├── credentials/              # Credential types for authentication
│   └── BetterZendeskApi.credentials.ts
├── nodes/
│   └── BetterZendesk/       # Main node implementation
│       ├── BetterZendesk.node.ts
│       ├── zendeskErrorHeaders.ts  # Error handling with header extraction
│       └── resources/        # Resource-specific implementations
│           ├── ticket/
│           ├── user/
│           ├── organization/
│           ├── view/
│           └── ticketField/
└── test/                     # Test files
```

## Code Style and Conventions

### TypeScript

- Use strict TypeScript settings (enabled in tsconfig.json)
- Target ES2019
- Use explicit types, avoid `any` where possible
- Use `noImplicitAny: true`
- Use `strictNullChecks: true`

### n8n Node Development

1. **Node Structure**: Nodes implement `INodeType` interface with a description property
2. **Credentials**: Implement `ICredentialType` interface
3. **Resources**: Each resource (ticket, user, organization, view, ticketField) has its own directory with:
   - `index.ts` - Resource description and routing
   - `helpers.ts` - Helper functions for data transformation

### Error Handling Pattern

This node uses a custom error handling pattern that captures Zendesk-specific headers:

```typescript
// Use zendeskPostReceive in routing configuration
routing: {
  output: {
    postReceive: [zendeskPostReceive]
  }
}
```

**Important headers captured**:
- `X-Rate-Limit-*` - Rate limiting information
- `X-Zendesk-Request-Id` - Request tracking ID
- `Retry-After` - Retry timing for rate limits

### Naming Conventions

- **Credential names**: Use camelCase (e.g., `betterZendeskApi`)
- **Node names**: Use camelCase (e.g., `betterZendesk`)
- **Display names**: Use proper capitalization (e.g., "Better Zendesk")
- **Parameter names**: Use camelCase (e.g., `ticketId`, `userId`)
- **Resource names**: Use singular form (e.g., `ticket`, `user`, not `tickets`)

### Request Configuration

All API operations should:
- Use `requestDefaults` to set base URL: `https://{subdomain}.zendesk.com/api/v2/`
- Set headers: `Accept: application/json`, `Content-Type: application/json`
- Use `resolveWithFullResponse: true` to access response headers
- Include error handling via `zendeskPostReceive`

## Testing Guidelines

### Test Structure

- Tests use Vitest framework
- Test files should be in the `test/` directory
- Name test files with `.test.ts` suffix
- Use `describe` blocks for grouping related tests
- Use `it` for individual test cases

### Test Coverage Focus

1. **Error Header Extraction**: Test `pickZendeskErrorHeaders` for various header combinations and case sensitivity
2. **Error Handling**: Test `zendeskPostReceive` for different HTTP status codes (2xx, 4xx, 5xx)
3. **Data Transformation**: Test helper functions like `prepareTicketCreate` and `prepareTicketUpdate`
4. **Resource Descriptions**: Test that all resources have correct routing and parameters

### Mock Pattern

```typescript
const mockCtx = (params: Record<string, unknown>): MockCtx => ({
  getNodeParameter: (name: string, _index: number, defaultValue?: unknown) =>
    name in params ? params[name] : defaultValue,
  getNode: () => ({ name: 'Test Node', type: 'betterZendesk' }),
});
```

## Authentication

- Uses HTTP Basic Authentication with Zendesk API tokens
- Username format: `{email}/token`
- Password: API token value
- Base URL built from subdomain parameter

## Common Patterns

### Adding a New Operation

1. Add operation to the resource's operation options
2. Define routing configuration with method and URL
3. Add error handling with `postReceive: [zendeskPostReceive]`
4. Define required parameters with display options
5. For create/update operations, add `preSend` hook if data transformation is needed
6. Add tests for the new operation

### Data Transformation

- Use `preSend` hooks for transforming input data (e.g., `prepareTicketCreate`)
- Use `postReceive` hooks for error handling (always use `zendeskPostReceive`)
- Handle both string and array inputs for fields like tags
- Parse JSON strings for complex fields like custom fields

## Important Notes

- Always include `zendeskPostReceive` in the `postReceive` array for API operations to ensure proper error handling
- Zendesk API uses snake_case, but n8n parameters use camelCase - transform as needed
- Rate limiting is handled by capturing and exposing rate limit headers in errors
- The node uses declarative routing configuration rather than `execute()` method
- Custom fields in tickets are JSON strings that need to be parsed
- Tags can be provided as comma-separated strings or arrays

## Dependencies

- `n8n-workflow`: Core n8n types and utilities
- `n8n-nodes-base`: Base node implementations (dev dependency)
- `@n8n/node-cli`: CLI tool for building and linting n8n nodes

## Release Process

- Uses semantic-release for automated releases
- Follows conventional commits
- Publishes to npm registry
- GitHub Actions handle CI/CD

## Development Tips

1. Use `yarn dev` for local development with hot reload
2. Use `yarn build:watch` to continuously build TypeScript changes
3. Run tests frequently with `yarn test` to catch issues early
4. Use `yarn lint:fix` to automatically fix linting issues
5. Check the n8n documentation for node development best practices: https://docs.n8n.io/integrations/creating-nodes/

## Security Considerations

- Never log or expose API tokens
- Sensitive headers are filtered - only Zendesk-specific headers are captured
- Authentication credentials are handled by n8n's credential system
- API tokens should be stored securely in n8n credentials
