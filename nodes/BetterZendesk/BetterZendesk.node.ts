import {
	NodeConnectionTypes,
	type IDataObject,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { userDescription } from './resources/user';
import { organizationDescription } from './resources/organization';
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
						name: 'Organization',
						value: 'organization',
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
			...organizationDescription,
			...ticketDescription,
			...ticketFieldDescription,
			...viewDescription,
		],
	};

	methods = {
		loadOptions: {
			// Get custom ticket fields
			async getCustomFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/ticket_fields.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const ticketFields = response.ticket_fields;

					if (!Array.isArray(ticketFields)) {
						return [];
					}

					return ticketFields
						.filter((field: IDataObject) => field.type === 'custom')
						.map((field: IDataObject) => ({
							name: field.title as string,
							value: field.id as number,
						}));
				} catch {
					return [];
				}
			},

			// Get groups
			async getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/groups.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const groups = response.groups;

					if (!Array.isArray(groups)) {
						return [];
					}

					return groups.map((group: IDataObject) => ({
						name: group.name as string,
						value: group.id as number,
					}));
				} catch {
					return [];
				}
			},

			// Get tags
			async getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/autocomplete/tags.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const tags = response.tags;

					if (!Array.isArray(tags)) {
						return [];
					}

					return tags.map((tag: IDataObject) => ({
						name: tag.name as string,
						value: tag.name as string,
					}));
				} catch {
					return [];
				}
			},

			// Get locales
			async getLocales(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/locales.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const locales = response.locales;

					if (!Array.isArray(locales)) {
						return [];
					}

					return locales.map((locale: IDataObject) => ({
						name: locale.name as string,
						value: locale.id as number,
					}));
				} catch {
					return [];
				}
			},

			// Get user custom fields
			async getUserFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/user_fields.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const userFields = response.user_fields;

					if (!Array.isArray(userFields)) {
						return [];
					}

					return userFields.map((field: IDataObject) => ({
						name: field.title as string,
						value: field.id as number,
					}));
				} catch {
					return [];
				}
			},

			// Get organization custom fields
			async getOrganizationFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/organization_fields.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const organizationFields = response.organization_fields;

					if (!Array.isArray(organizationFields)) {
						return [];
					}

					return organizationFields.map((field: IDataObject) => ({
						name: field.title as string,
						value: field.id as number,
					}));
				} catch {
					return [];
				}
			},

			// Get organizations
			async getOrganizations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('betterZendeskApi');
				const subdomain = credentials.subdomain as string;
				const requestOptions = {
					method: 'GET' as const,
					url: `https://${subdomain}.zendesk.com/api/v2/organizations.json`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequest(requestOptions);
					const organizations = response.organizations;

					if (!Array.isArray(organizations)) {
						return [];
					}

					return organizations.map((organization: IDataObject) => ({
						name: organization.name as string,
						value: organization.id as number,
					}));
				} catch {
					return [];
				}
			},
		},
	};
}
