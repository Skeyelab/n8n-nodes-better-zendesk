import type { INodeProperties } from 'n8n-workflow';
import { zendeskPostReceive } from '../../zendeskErrorHeaders';

const showOnlyForViews = {
	resource: ['view'],
};

export const viewDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForViews,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a view',
				description: 'Retrieve a view by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/views/{{$parameter.viewId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many views',
				description: 'List views',
				routing: {
					request: {
						method: 'GET',
						url: '/views.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Tickets',
				value: 'getTickets',
				action: 'Get tickets for a view',
				description: 'List tickets returned by a view',
				routing: {
					request: {
						method: 'GET',
						url: '=/views/{{$parameter.viewId}}/tickets.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'View ID',
		name: 'viewId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['view'],
				operation: ['get', 'getTickets'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['view'],
				operation: ['getAll', 'getTickets'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: {
				paginate: '={{ $value }}',
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['view'],
				operation: ['getAll', 'getTickets'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
		routing: {
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
];
