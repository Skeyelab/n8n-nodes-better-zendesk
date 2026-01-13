import type { INodeProperties } from 'n8n-workflow';
import { zendeskPostReceive } from '../../zendeskErrorHeaders';
import { userCreateDescription } from './create';
import { userGetDescription } from './get';
import { userGetAllDescription } from './getAll';
import { userUpdateDescription } from './update';
import { userSearchDescription } from './search';

const showOnlyForUsers = {
	resource: ['user'],
};

export const userDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForUsers,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get users',
				description: 'Get many users',
				routing: {
					request: {
						method: 'GET',
						url: '/users.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a user',
				description: 'Get the data of a single user',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$parameter.userId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a new user',
				description: 'Create a new user',
				routing: {
					request: {
						method: 'POST',
						url: '/users.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a user',
				description: 'Update a user',
				routing: {
					request: {
						method: 'PUT',
						url: '=/users/{{$parameter.userId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a user',
				description: 'Delete a user',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/users/{{$parameter.userId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search users',
				description: 'Search users',
				routing: {
					request: {
						method: 'GET',
						url: '/users/search.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Organizations',
				value: 'getOrganizations',
				action: 'Get user organizations',
				description: "Get a user's organizations",
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$parameter.userId}}/organizations.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Related Data',
				value: 'getRelatedData',
				action: 'Get user related data',
				description: "Get a user's related data",
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$parameter.userId}}/related.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
		],
		default: 'getAll',
	},
	...userGetDescription,
	...userGetAllDescription,
	...userCreateDescription,
	...userUpdateDescription,
	...userSearchDescription,
];
