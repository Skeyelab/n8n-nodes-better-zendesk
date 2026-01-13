import type { INodeProperties } from 'n8n-workflow';

const showOnlyForOrganizationUpdate = {
	operation: ['update'],
	resource: ['organization'],
};

export const organizationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForOrganizationUpdate,
		},
		description: 'The name of the organization',
		routing: {
			send: {
				type: 'body',
				property: 'organization.name',
			},
		},
	},
	{
		displayName: 'Details',
		name: 'details',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForOrganizationUpdate,
		},
		description: 'Details about the organization',
		routing: {
			send: {
				type: 'body',
				property: 'organization.details',
			},
		},
	},
	{
		displayName: 'Domain Names',
		name: 'domainNames',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForOrganizationUpdate,
		},
		description: 'Comma-separated domain names associated with the organization',
		routing: {
			send: {
				type: 'body',
				property: 'organization.domain_names',
				value: '={{ $value ? $value.split(",").map(d => d.trim()) : undefined }}',
			},
		},
	},
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForOrganizationUpdate,
		},
		description: 'Notes about the organization',
		routing: {
			send: {
				type: 'body',
				property: 'organization.notes',
			},
		},
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForOrganizationUpdate,
		},
		description: 'Comma-separated tags for the organization',
		routing: {
			send: {
				type: 'body',
				property: 'organization.tags',
				value: '={{ $value ? $value.split(",").map(t => t.trim()).filter(t => t) : undefined }}',
			},
		},
	},
];
