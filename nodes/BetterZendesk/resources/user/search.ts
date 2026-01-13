import type { INodeProperties } from 'n8n-workflow';

const showOnlyForUserSearch = {
	operation: ['search'],
	resource: ['user'],
};

export const userSearchDescription: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForUserSearch,
		},
		description: 'Search query to find users',
		routing: {
			send: {
				type: 'query',
				property: 'query',
			},
		},
	},
];
