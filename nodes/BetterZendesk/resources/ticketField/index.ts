import type { INodeProperties } from 'n8n-workflow';
import { zendeskPostReceive } from '../../zendeskErrorHeaders';
import { ticketFieldGetDescription } from './get';
import { ticketFieldGetManyDescription } from './getAll';

const showOnlyForTicketFields = {
	resource: ['ticketField'],
};

export const ticketFieldDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForTicketFields,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a ticket field',
				description: 'Retrieve a ticket field by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/ticket_fields/{{$parameter.ticketFieldId}}.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get ticket fields',
				description: 'List many ticket fields',
				routing: {
					request: {
						method: 'GET',
						url: '/ticket_fields.json',
					},
					output: {
						postReceive: [zendeskPostReceive],
					},
				},
			},
		],
		default: 'getAll',
	},
	...ticketFieldGetDescription,
	...ticketFieldGetManyDescription,
];
