import type { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

type TicketBody = {
	ticket: {
		subject?: string;
		comment?: { body: string; public?: boolean };
		status?: string;
		type?: string;
		tags?: string[];
		custom_fields?: Array<{ id: string; value: unknown }>;
		recipient?: string;
		external_id?: string;
		group_id?: number;
		assignee_id?: number;
	};
};

	const parseJson = (raw: string | undefined) => {
	if (!raw) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
};

const normalizeTags = (raw: string[] | string | undefined): string[] | undefined => {
	if (Array.isArray(raw)) return raw.filter(Boolean);
	if (typeof raw === 'string') return raw.split(',').map((t) => t.trim()).filter(Boolean);
	return undefined;
};

const parseNumber = (raw: string | number | undefined): number | undefined => {
	if (typeof raw === 'number') return raw;
	if (typeof raw === 'string' && raw.trim()) {
		const parsed = Number(raw);
		if (!isNaN(parsed)) return parsed;
	}
	return undefined;
};

export async function prepareTicketCreate(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const subject = this.getNodeParameter('subject', 0, '') as string;
	const description = this.getNodeParameter('description', 0) as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const status = this.getNodeParameter('status', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const type = this.getNodeParameter('type', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const tags = this.getNodeParameter('tags', 0, []) as string[] | string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const customFieldsJson = this.getNodeParameter('customFields', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const recipient = this.getNodeParameter('recipient', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const externalId = this.getNodeParameter('externalId', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const group = this.getNodeParameter('group', 0, '') as string | number;

	const body: TicketBody = {
		ticket: {
			comment: { body: description, public: true },
		},
	};

	if (subject) body.ticket.subject = subject;
	if (status) body.ticket.status = status;
	if (type) body.ticket.type = type;
	const normalizedTags = normalizeTags(tags);
	if (normalizedTags?.length) body.ticket.tags = normalizedTags;
	const customFields = parseJson(customFieldsJson);
	if (Array.isArray(customFields)) body.ticket.custom_fields = customFields as TicketBody['ticket']['custom_fields'];
	if (recipient) body.ticket.recipient = recipient;
	if (externalId) body.ticket.external_id = externalId;
	const groupId = parseNumber(group);
	if (groupId !== undefined) body.ticket.group_id = groupId;

	requestOptions.body = body;
	return requestOptions;
}

export async function prepareTicketUpdate(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const subject = this.getNodeParameter('subject', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const status = this.getNodeParameter('status', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const internalNote = this.getNodeParameter('internalNote', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const publicReply = this.getNodeParameter('publicReply', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const assigneeEmail = this.getNodeParameter('assigneeEmail', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const externalId = this.getNodeParameter('externalId', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const group = this.getNodeParameter('group', 0, '') as string | number;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const type = this.getNodeParameter('type', 0, '') as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const tags = this.getNodeParameter('tags', 0, []) as string[] | string;

	const body: TicketBody = { ticket: {} };
	if (subject) body.ticket.subject = subject;
	if (status) body.ticket.status = status;
	if (type) body.ticket.type = type;
	const normalizedTags = normalizeTags(tags);
	if (normalizedTags?.length) body.ticket.tags = normalizedTags;
	if (externalId) body.ticket.external_id = externalId;
	const groupId = parseNumber(group);
	if (groupId !== undefined) body.ticket.group_id = groupId;
	// Note: Zendesk API requires assignee_id (numeric), but we accept assigneeEmail for UI consistency with upstream
	// Users should provide the numeric ID - in routing-based nodes, email lookup would require additional API calls
	const assigneeIdNum = parseNumber(assigneeEmail);
	if (assigneeIdNum !== undefined) body.ticket.assignee_id = assigneeIdNum;

	if (internalNote) {
		body.ticket.comment = { body: internalNote, public: false };
	}
	if (publicReply) {
		body.ticket.comment = { body: publicReply, public: true };
	}

	requestOptions.body = body;
	return requestOptions;
}
