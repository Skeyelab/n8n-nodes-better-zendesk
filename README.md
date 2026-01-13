# n8n-nodes-better-zendesk

This is an n8n community node for Zendesk Support with richer error visibility (selected response headers are surfaced when calls fail).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Tickets: create, get, get many, update, delete, recover suspended ticket
- Views: list views, get a view, get tickets for a view
- Users/Companies: basic placeholder resources (matches starter template; Tickets/Views are primary focus for now)

## Credentials

- Zendesk API Token auth
  - Subdomain: your Zendesk subdomain (e.g. `acme` → `https://acme.zendesk.com`)
  - Email: agent email
  - API Token: generated in Zendesk admin
  - Auth uses HTTP Basic with username `email/token` and password `apiToken`

Base URL is built automatically from the subdomain (`https://{subdomain}.zendesk.com/api/v2/`).

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

- On failures, the node throws `NodeApiError` that includes a safe subset of response headers (rate-limit headers and `x-zendesk-request-id`). In “Continue On Fail”, these headers are available in the error item for troubleshooting.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* _Link to app/service documentation._

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._
