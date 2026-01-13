import type { INodeProperties } from 'n8n-workflow';

const showOnlyForOrganizationCreate = {
	operation: ['create'],
	resource: ['organization'],
};

export const organizationCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForOrganizationCreate,
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
			show: showOnlyForOrganizationCreate,
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
			show: showOnlyForOrganizationCreate,
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
			show: showOnlyForOrganizationCreate,
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
			show: showOnlyForOrganizationCreate,
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
