import type { INodeProperties } from 'n8n-workflow';

const showOnlyForUserUpdate = {
	operation: ['update'],
	resource: ['user'],
};

export const userUpdateDescription: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		displayOptions: { show: showOnlyForUserUpdate },
		required: true,
		default: '',
		description: "The user's ID to update",
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'The name of the user',
		routing: {
			send: {
				type: 'body',
				property: 'user.name',
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'The email address of the user',
		routing: {
			send: {
				type: 'body',
				property: 'user.email',
			},
		},
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		options: [
			{ name: 'End User', value: 'end-user' },
			{ name: 'Agent', value: 'agent' },
			{ name: 'Admin', value: 'admin' },
		],
		default: 'end-user',
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'The role of the user',
		routing: {
			send: {
				type: 'body',
				property: 'user.role',
			},
		},
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'The phone number of the user',
		routing: {
			send: {
				type: 'body',
				property: 'user.phone',
			},
		},
	},
	{
		displayName: 'Verified',
		name: 'verified',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'Whether the user is verified',
		routing: {
			send: {
				type: 'body',
				property: 'user.verified',
			},
		},
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: showOnlyForUserUpdate,
		},
		description: 'Whether the user is active',
		routing: {
			send: {
				type: 'body',
				property: 'user.active',
			},
		},
	},
];
