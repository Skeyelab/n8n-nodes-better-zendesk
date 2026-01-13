import type { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

type CustomFieldValue = { id: string | number; value: unknown };

type TicketBody = {
	ticket: {
		subject?: string;
		comment?: { body: string; public?: boolean };
		status?: string;
		type?: string;
		tags?: string[];
		custom_fields?: CustomFieldValue[];
		recipient?: string;
		external_id?: string;
		group_id?: number;
		assignee_id?: number;
		assignee_email?: string;
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

const extractCustomFields = (
	customFieldsUi: IDataObject | undefined,
): CustomFieldValue[] | undefined => {
	if (!customFieldsUi) return undefined;
	const customFieldsValues = customFieldsUi.customFieldsValues as
		| Array<{ id: string | number; value: unknown }>
		| undefined;
	if (!Array.isArray(customFieldsValues) || customFieldsValues.length === 0) return undefined;
	return customFieldsValues.map((cf) => ({ id: cf.id, value: cf.value }));
};

export async function prepareTicketCreate(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const description = this.getNodeParameter('description', 0) as string;
	// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
	const jsonParameters = this.getNodeParameter('jsonParameters', 0, false) as boolean;

	if (jsonParameters) {
		// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
		const additionalFieldsJson = this.getNodeParameter('additionalFieldsJson', 0, '') as string;
		const parsedJson = parseJson(additionalFieldsJson) as IDataObject | undefined;
		const body: TicketBody = {
			ticket: {
				comment: { body: description, public: true },
				...(parsedJson || {}),
			},
		};
		requestOptions.body = body;
		return requestOptions;
	}

	const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as IDataObject;

	const subject = additionalFields.subject as string | undefined;
	const status = additionalFields.status as string | undefined;
	const type = additionalFields.type as string | undefined;
	const tags = additionalFields.tags as string[] | string | undefined;
	const customFieldsUi = additionalFields.customFieldsUi as IDataObject | undefined;
	const recipient = additionalFields.recipient as string | undefined;
	const externalId = additionalFields.externalId as string | undefined;
	const group = additionalFields.group as string | number | undefined;

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
	const customFields = extractCustomFields(customFieldsUi);
	if (customFields) body.ticket.custom_fields = customFields;
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
	const jsonParameters = this.getNodeParameter('jsonParameters', 0, false) as boolean;

	if (jsonParameters) {
		// @ts-expect-error - getNodeParameter overloads accept default values but TypeScript strict mode requires options object
		const updateFieldsJson = this.getNodeParameter('updateFieldsJson', 0, '') as string;
		const parsedJson = parseJson(updateFieldsJson) as IDataObject | undefined;
		const body: TicketBody = {
			ticket: {
				...(parsedJson || {}),
			},
		};
		requestOptions.body = body;
		return requestOptions;
	}

	const updateFields = this.getNodeParameter('updateFields', 0, {}) as IDataObject;

	const subject = updateFields.subject as string | undefined;
	const status = updateFields.status as string | undefined;
	const internalNote = updateFields.internalNote as string | undefined;
	const publicReply = updateFields.publicReply as string | undefined;
	const assigneeEmail = updateFields.assigneeEmail as string | undefined;
	const externalId = updateFields.externalId as string | undefined;
	const group = updateFields.group as string | number | undefined;
	const type = updateFields.type as string | undefined;
	const tags = updateFields.tags as string[] | string | undefined;
	const recipient = updateFields.recipient as string | undefined;
	const customFieldsUi = updateFields.customFieldsUi as IDataObject | undefined;

	const body: TicketBody = { ticket: {} };

	if (subject) body.ticket.subject = subject;
	if (status) body.ticket.status = status;
	if (type) body.ticket.type = type;
	const normalizedTags = normalizeTags(tags);
	if (normalizedTags?.length) body.ticket.tags = normalizedTags;
	if (externalId) body.ticket.external_id = externalId;
	const groupId = parseNumber(group);
	if (groupId !== undefined) body.ticket.group_id = groupId;
	if (recipient) body.ticket.recipient = recipient;
	const customFields = extractCustomFields(customFieldsUi);
	if (customFields) body.ticket.custom_fields = customFields;

	// Zendesk API accepts assignee_email directly for setting assignee by email
	if (assigneeEmail) body.ticket.assignee_email = assigneeEmail;

	if (internalNote) {
		body.ticket.comment = { body: internalNote, public: false };
	}
	if (publicReply) {
		body.ticket.comment = { body: publicReply, public: true };
	}

	requestOptions.body = body;
	return requestOptions;
}
