import type { INodeProperties } from 'n8n-workflow';
import { zendeskPostReceive } from '../../zendeskErrorHeaders';
import { organizationCreateDescription } from './create';
import { organizationGetDescription } from './get';
import { organizationGetAllDescription } from './getAll';
import { organizationUpdateDescription } from './update';

const showOnlyForOrganizations = {
	resource: ['organization'],
};

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForOrganizations,
		},
		options: [
			{
				name: 'Count',
				value: 'count',
				action: 'Count organizations',
				description: 'Count organizations',
				routing: {
					request: {
						method: 'GET',
						url: '/organizations/count.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get organizations',
				description: 'Get many organizations',
				routing: {
					request: {
						method: 'GET',
						url: '/organizations.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an organization',
				description: 'Get the data of a single organization',
				routing: {
					request: {
						method: 'GET',
						url: '=/organizations/{{$parameter.organizationId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an organization',
				description: 'Create a new organization',
				routing: {
					request: {
						method: 'POST',
						url: '/organizations.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization',
				description: 'Update an organization',
				routing: {
					request: {
						method: 'PUT',
						url: '=/organizations/{{$parameter.organizationId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an organization',
				description: 'Delete an organization',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/organizations/{{$parameter.organizationId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Related Data',
				value: 'getRelatedData',
				action: 'Get organization related data',
				description: "Get an organization's related data",
				routing: {
					request: {
						method: 'GET',
						url: '=/organizations/{{$parameter.organizationId}}/related.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
		],
		default: 'getAll',
	},
	...organizationGetDescription,
	...organizationGetAllDescription,
	...organizationCreateDescription,
	...organizationUpdateDescription,
];
