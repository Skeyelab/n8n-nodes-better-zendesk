import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BetterZendeskApi implements ICredentialType {
	name = 'betterZendeskApi';

	displayName = 'Better Zendesk API';

	icon = 'file:betterZendesk.svg';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/-better-zendesk?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Subdomain',
			name: 'subdomain',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'acme',
			description: 'Your Zendesk subdomain (https://SUBDOMAIN.zendesk.com)',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			required: true,
			default: '',
			description: 'Zendesk agent email associated with the API token',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Zendesk API token',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.email }}/token',
				password: '={{ $credentials.apiToken }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{`https://${$credentials.subdomain}.zendesk.com/api/v2/`}}',
			url: '/tickets.json',
		},
	};
}
