import type { INodeProperties } from 'n8n-workflow';

const showOnlyForTicketFieldGet = {
	operation: ['get'],
	resource: ['ticketField'],
};

export const ticketFieldGetDescription: INodeProperties[] = [
	{
		displayName: 'Ticket Field ID',
		name: 'ticketFieldId',
		type: 'string',
		displayOptions: { show: showOnlyForTicketFieldGet },
		required: true,
		default: '',
		description: 'The ticket field ID to retrieve',
	},
];
