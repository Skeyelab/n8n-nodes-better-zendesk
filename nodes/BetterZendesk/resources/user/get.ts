import type { INodeProperties } from 'n8n-workflow';

const showOnlyForUserGet = {
	operation: ['get', 'update', 'delete', 'getOrganizations', 'getRelatedData'],
	resource: ['user'],
};

export const userGetDescription: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		displayOptions: { show: showOnlyForUserGet },
		required: true,
		default: '',
		description: "The user's ID",
	},
];
