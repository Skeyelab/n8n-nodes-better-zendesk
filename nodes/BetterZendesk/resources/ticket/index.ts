import type { INodeProperties } from 'n8n-workflow';
import { zendeskPostReceive } from '../../zendeskErrorHeaders';
import { prepareTicketCreate, prepareTicketUpdate } from './helpers';

const showOnlyForTickets = {
	resource: ['ticket'],
};

export const ticketDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForTickets,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a ticket',
				description: 'Create a ticket',
				routing: {
					request: {
						method: 'POST',
						url: '/tickets.json',
					},
					send: {
						preSend: [prepareTicketCreate],
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a ticket',
				description: 'Get a ticket by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/tickets/{{$parameter.id}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many tickets',
				description: 'Get many tickets',
				routing: {
					request: {
						method: 'GET',
						url: '/tickets.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a ticket',
				description: 'Update a ticket',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tickets/{{$parameter.id}}.json',
					},
					send: {
						preSend: [prepareTicketUpdate],
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a ticket',
				description: 'Delete a ticket',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tickets/{{$parameter.id}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Recover',
				value: 'recover',
				action: 'Recover a ticket',
				description: 'Recover a suspended ticket',
				routing: {
					request: {
						method: 'PUT',
						url: '=/suspended_tickets/{{$parameter.id}}/recover.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Ticket ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['get', 'update', 'delete', 'recover'],
			},
		},
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create', 'update'],
			},
		},
		description: 'The subject of the ticket',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'First public comment on the ticket',
	},
	{
		displayName: 'Public Reply',
		name: 'publicReply',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'Adds a public reply as the latest comment',
	},
	{
		displayName: 'Internal Note',
		name: 'internalNote',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'Adds an internal note as the latest comment',
	},
	{
		displayName: 'Assignee Email',
		name: 'assigneeEmail',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'The e-mail address of the assignee',
		placeholder: 'agent@example.com',
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'An ID you can use to link Zendesk Support tickets to local records',
	},
	{
		displayName: 'Group Name or ID',
		name: 'group',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description:
			'The group this ticket is assigned to. Specify a group ID (numeric) or name using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		placeholder: '12345',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Question', value: 'question' },
			{ name: 'Incident', value: 'incident' },
			{ name: 'Problem', value: 'problem' },
			{ name: 'Task', value: 'task' },
		],
		default: 'question',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'The type of this ticket',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		description: 'Comma-separated tags to set on the ticket',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Closed', value: 'closed' },
			{ name: 'New', value: 'new' },
			{ name: 'On-Hold', value: 'hold' },
			{ name: 'Open', value: 'open' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Solved', value: 'solved' },
		],
		default: 'new',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create', 'update'],
			},
		},
		description: 'State of the ticket',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Question', value: 'question' },
			{ name: 'Incident', value: 'incident' },
			{ name: 'Problem', value: 'problem' },
			{ name: 'Task', value: 'task' },
		],
		default: 'question',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'Type of ticket',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'Comma-separated tags to set on the ticket',
	},
	{
		displayName: 'Recipient',
		name: 'recipient',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'Original recipient email address of the ticket',
	},
	{
		displayName: 'Custom Fields (JSON)',
		name: 'customFields',
		type: 'json',
		default: '',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'Array of custom field IDs and values (use your Zendesk custom field IDs)',
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'An ID you can use to link Zendesk Support tickets to local records',
	},
	{
		displayName: 'Group Name or ID',
		name: 'group',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description:
			'The group this ticket is assigned to. Specify a group ID (numeric) or name using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		placeholder: '12345',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['getAll'],
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
				resource: ['ticket'],
				operation: ['getAll'],
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
