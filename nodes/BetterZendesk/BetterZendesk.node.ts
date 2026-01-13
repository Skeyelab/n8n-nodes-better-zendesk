import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';
import { ticketDescription } from './resources/ticket';
import { viewDescription } from './resources/view';
import { ticketFieldDescription } from './resources/ticketField';

export class BetterZendesk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Better Zendesk',
		name: 'betterZendesk',
		icon: { light: 'file:betterZendesk.svg', dark: 'file:betterZendesk.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Better Zendesk API',
		defaults: {
			name: 'Better Zendesk',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'betterZendeskApi', required: true }],
		requestDefaults: {
			baseURL: '={{`https://${$credentials.subdomain}.zendesk.com/api/v2/`}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			// @ts-expect-error - simple and resolveWithFullResponse are valid properties but not in TypeScript definitions
			simple: false,
			resolveWithFullResponse: true,
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Ticket',
						value: 'ticket',
					},
					{
						name: 'Ticket Field',
						value: 'ticketField',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'View',
						value: 'view',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
			...ticketDescription,
			...ticketFieldDescription,
			...viewDescription,
		],
	};
}
