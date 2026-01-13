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
		],
		default: 'create',
	},

	/* -------------------------------------------------------------------------- */
	/*                                ticket:create                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		required: true,
		description: 'The first comment on the ticket',
	},
	{
		displayName: 'JSON Parameters',
		name: 'jsonParameters',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
				jsonParameters: [false],
			},
		},
		options: [
			{
				displayName: 'Custom Fields',
				name: 'customFieldsUi',
				placeholder: 'Add Custom Field',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Custom Field',
						name: 'customFieldsValues',
						values: [
							{
								displayName: 'Name or ID',
								name: 'id',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getCustomFields',
								},
								default: '',
								description:
									'Custom field ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom field Value',
							},
						],
					},
				],
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'An ID you can use to link Zendesk Support tickets to local records',
			},
			{
				displayName: 'Group Name or ID',
				name: 'group',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroups',
				},
				default: '',
				description:
					'The group this ticket is assigned to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				description: 'The original recipient e-mail address of the ticket',
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
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: '',
				description: 'The state of the ticket',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'The value of the subject field for this ticket',
			},
			{
				displayName: 'Tag Names or IDs',
				name: 'tags',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getTags',
				},
				default: [],
				description:
					'The array of tags applied to this ticket. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: '',
				description: 'The type of this ticket',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsJson',
		type: 'json',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
				jsonParameters: [true],
			},
		},
		description:
			'Object of values to set as described <a href="https://developer.zendesk.com/rest_api/docs/support/tickets">here</a>',
	},

	/* -------------------------------------------------------------------------- */
	/*                                ticket:update                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Ticket ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'JSON Parameters',
		name: 'jsonParameters',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
				jsonParameters: [false],
			},
		},
		options: [
			{
				displayName: 'Assignee Email',
				name: 'assigneeEmail',
				type: 'string',
				default: '',
				description: 'The e-mail address of the assignee',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFieldsUi',
				placeholder: 'Add Custom Field',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Custom Field',
						name: 'customFieldsValues',
						values: [
							{
								displayName: 'Name or ID',
								name: 'id',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getCustomFields',
								},
								default: '',
								description:
									'Custom field ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom field Value',
							},
						],
					},
				],
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'An ID you can use to link Zendesk Support tickets to local records',
			},
			{
				displayName: 'Group Name or ID',
				name: 'group',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroups',
				},
				default: '',
				description:
					'The group this ticket is assigned to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Internal Note',
				name: 'internalNote',
				type: 'string',
				default: '',
				description: 'Internal Ticket Note (Accepts HTML)',
			},
			{
				displayName: 'Public Reply',
				name: 'publicReply',
				type: 'string',
				default: '',
				description: 'Public ticket reply',
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				description: 'The original recipient e-mail address of the ticket',
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
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: '',
				description: 'The state of the ticket',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'The value of the subject field for this ticket',
			},
			{
				displayName: 'Tag Names or IDs',
				name: 'tags',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getTags',
				},
				default: [],
				description:
					'The array of tags applied to this ticket. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: '',
				description: 'The type of this ticket',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFieldsJson',
		type: 'json',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
				jsonParameters: [true],
			},
		},
		description:
			'Object of values to update as described <a href="https://developer.zendesk.com/rest_api/docs/support/tickets">here</a>',
	},

	/* -------------------------------------------------------------------------- */
	/*                                ticket:get                                  */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Ticket ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['get'],
			},
		},
	},

	/* -------------------------------------------------------------------------- */
	/*                                ticket:getAll                               */
	/* -------------------------------------------------------------------------- */
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

	/* -------------------------------------------------------------------------- */
	/*                                ticket:delete                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Ticket ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['delete'],
			},
		},
	},

	/* -------------------------------------------------------------------------- */
	/*                                ticket:recover                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Suspended Ticket ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['recover'],
			},
		},
	},
];
