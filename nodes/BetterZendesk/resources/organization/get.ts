import type { INodeProperties } from 'n8n-workflow';

const showOnlyForOrganizationGet = {
	operation: ['get', 'update', 'delete', 'getRelatedData'],
	resource: ['organization'],
};

export const organizationGetDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		displayOptions: { show: showOnlyForOrganizationGet },
		required: true,
		default: '',
		description: "The organization's ID",
	},
];
