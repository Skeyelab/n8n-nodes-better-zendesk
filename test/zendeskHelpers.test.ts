/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';
import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	IN8nHttpFullResponse,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import {
	pickZendeskErrorHeaders,
	zendeskPostReceive,
} from '../nodes/BetterZendesk/zendeskErrorHeaders';
import { prepareTicketCreate, prepareTicketUpdate } from '../nodes/BetterZendesk/resources/ticket/helpers';
import { ticketFieldDescription } from '../nodes/BetterZendesk/resources/ticketField';
import { userDescription } from '../nodes/BetterZendesk/resources/user';
import { organizationDescription } from '../nodes/BetterZendesk/resources/organization';
import { ticketDescription } from '../nodes/BetterZendesk/resources/ticket';
import { viewDescription } from '../nodes/BetterZendesk/resources/view';
import { BetterZendesk } from '../nodes/BetterZendesk/BetterZendesk.node';
import { BetterZendeskApi } from '../credentials/BetterZendeskApi.credentials';

type MockCtx = {
	getNodeParameter: (name: string, index: number, defaultValue?: unknown) => unknown;
	getNode: () => { name: string; type: string };
};

const mockCtx = (params: Record<string, unknown>): MockCtx => ({
	getNodeParameter: (name: string, _index: number, defaultValue?: unknown) =>
		name in params ? params[name] : defaultValue,
	getNode: () => ({ name: 'Test Node', type: 'betterZendesk' }),
});

describe('pickZendeskErrorHeaders', () => {
	it('keeps only allowed headers (case-insensitive)', () => {
		const headers = {
			'X-Rate-Limit-Limit': '700',
			'X-Zendesk-Request-Id': 'abc',
			'Retry-After': '3',
			'Content-Type': 'application/json',
		};
		expect(pickZendeskErrorHeaders(headers)).toEqual({
			'X-Rate-Limit-Limit': '700',
			'X-Zendesk-Request-Id': 'abc',
			'Retry-After': '3',
		});
	});

	it('returns empty object when nothing matches', () => {
		expect(pickZendeskErrorHeaders({ 'Content-Type': 'application/json' })).toEqual({});
	});

	it('handles lowercase headers', () => {
		const headers = {
			'x-rate-limit-remaining': '100',
			'x-zendesk-request-id': 'def',
			'retry-after': '5',
		};
		expect(pickZendeskErrorHeaders(headers)).toEqual({
			'x-rate-limit-remaining': '100',
			'x-zendesk-request-id': 'def',
			'retry-after': '5',
		});
	});

	it('handles mixed case headers', () => {
		const headers = {
			'X-Rate-Limit-Remaining': '50',
			'x-zendesk-request-id': 'ghi',
			'RETRY-AFTER': '10',
		};
		const result = pickZendeskErrorHeaders(headers);
		expect(result['X-Rate-Limit-Remaining']).toBe('50');
		expect(result['x-zendesk-request-id']).toBe('ghi');
		expect(result['RETRY-AFTER']).toBe('10');
	});

	it('handles empty headers object', () => {
		expect(pickZendeskErrorHeaders({})).toEqual({});
	});

	it('handles undefined headers', () => {
		expect(pickZendeskErrorHeaders(undefined)).toEqual({});
	});

	it('filters out non-matching headers', () => {
		const headers = {
			'X-Rate-Limit-Limit': '700',
			'Authorization': 'Bearer token',
			'Content-Type': 'application/json',
			'X-Custom-Header': 'value',
		};
		const result = pickZendeskErrorHeaders(headers);
		expect(result).toEqual({
			'X-Rate-Limit-Limit': '700',
		});
		expect(result).not.toHaveProperty('Authorization');
		expect(result).not.toHaveProperty('Content-Type');
		expect(result).not.toHaveProperty('X-Custom-Header');
	});
});

describe('zendeskPostReceive', () => {
	const mockItems: INodeExecutionData[] = [{ json: { test: 'data' } }];
	const mockCtx = {
		getNode: () => ({ name: 'Test Node', type: 'betterZendesk' }),
	} as unknown as IExecuteSingleFunctions;

	it('returns items on successful response (status < 400)', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 200,
			statusMessage: 'OK',
			headers: {},
			body: { ticket: { id: 1 } },
		};

		const result = await zendeskPostReceive.call(mockCtx, mockItems, response);
		expect(result).toEqual(mockItems);
	});

	it('throws NodeApiError on 4xx error with headers', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 404,
			statusMessage: 'Not Found',
			headers: {
				'X-Rate-Limit-Limit': '700',
				'X-Zendesk-Request-Id': 'abc123',
				'Content-Type': 'application/json',
			},
			body: { error: 'Not found' },
		};

		await expect(zendeskPostReceive.call(mockCtx, mockItems, response)).rejects.toThrow(
			NodeApiError,
		);

		try {
			await zendeskPostReceive.call(mockCtx, mockItems, response);
		} catch (error) {
			expect(error).toBeInstanceOf(NodeApiError);
			if (error instanceof NodeApiError) {
				expect(error.httpCode).toBe('404');
			}
		}
	});

	it('throws NodeApiError on 5xx error', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			headers: {
				'Retry-After': '60',
			},
			body: { error: 'Server error' },
		};

		await expect(zendeskPostReceive.call(mockCtx, mockItems, response)).rejects.toThrow(
			NodeApiError,
		);
	});

	it('includes status code in error httpCode', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 429,
			statusMessage: 'Too Many Requests',
			headers: {
				'X-Rate-Limit-Limit': '700',
			},
			body: { error: 'Rate limit exceeded' },
		};

		try {
			await zendeskPostReceive.call(mockCtx, mockItems, response);
		} catch (error) {
			expect(error).toBeInstanceOf(NodeApiError);
			if (error instanceof NodeApiError) {
				expect(error.httpCode).toBe('429');
			}
		}
	});

	it('makes Retry-After header accessible in 429 errors for retry logic', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 429,
			statusMessage: 'Too Many Requests',
			headers: {
				'Retry-After': '60',
				'X-Rate-Limit-Limit': '700',
				'X-Rate-Limit-Remaining': '0',
				'X-Zendesk-Request-Id': 'req-123',
			},
			body: { error: 'Rate limit exceeded' },
		};

		try {
			await zendeskPostReceive.call(mockCtx, mockItems, response);
			expect.fail('Should have thrown NodeApiError');
		} catch (error) {
			expect(error).toBeInstanceOf(NodeApiError);
			if (error instanceof NodeApiError) {
				expect(error.httpCode).toBe('429');

				// Headers should be accessible in the error object
				// NodeApiError exposes headers in the response property
				const errorResponse = (error as unknown as { response?: { headers?: IDataObject } })
					.response;
				if (errorResponse?.headers) {
					expect(errorResponse.headers).toHaveProperty('Retry-After');
					expect(errorResponse.headers['Retry-After']).toBe('60');
					expect(errorResponse.headers).toHaveProperty('X-Rate-Limit-Limit');
					expect(errorResponse.headers).toHaveProperty('X-Rate-Limit-Remaining');
					expect(errorResponse.headers).toHaveProperty('X-Zendesk-Request-Id');
				}

				// Headers should also be accessible directly on error object
				const errorWithHeaders = error as unknown as { headers?: IDataObject };
				if (errorWithHeaders.headers) {
					expect(errorWithHeaders.headers).toHaveProperty('Retry-After');
					expect(errorWithHeaders.headers['Retry-After']).toBe('60');
					expect(errorWithHeaders.headers).toHaveProperty('X-Rate-Limit-Limit');
					expect(errorWithHeaders.headers).toHaveProperty('X-Rate-Limit-Remaining');
					expect(errorWithHeaders.headers).toHaveProperty('X-Zendesk-Request-Id');
				}

				// Headers should be in error message for visibility
				expect(error.message).toContain('Retry-After');
				expect(error.message).toContain('60');
				expect(error.message).toContain('X-Zendesk-Request-Id');
			}
		}
	});

	it('captures Retry-After header in various case formats', async () => {
		const testCases = [
			{ header: 'Retry-After', value: '30' },
			{ header: 'retry-after', value: '45' },
			{ header: 'RETRY-AFTER', value: '90' },
		];

		for (const testCase of testCases) {
			const response: IN8nHttpFullResponse = {
				statusCode: 429,
				statusMessage: 'Too Many Requests',
				headers: {
					[testCase.header]: testCase.value,
				},
				body: { error: 'Rate limit exceeded' },
			};

			try {
				await zendeskPostReceive.call(mockCtx, mockItems, response);
				expect.fail('Should have thrown NodeApiError');
			} catch (error) {
				expect(error).toBeInstanceOf(NodeApiError);
				if (error instanceof NodeApiError) {
					const errorResponse = (error as unknown as { response?: { headers?: IDataObject } })
						.response;
					if (errorResponse?.headers) {
						// The header should be captured regardless of case
						const headerKeys = Object.keys(errorResponse.headers);
						const retryHeader = headerKeys.find((key) => key.toLowerCase() === 'retry-after');
						expect(retryHeader).toBeDefined();
						if (retryHeader) {
							expect(errorResponse.headers[retryHeader]).toBe(testCase.value);
						}
					}
				}
			}
		}
	});

	it('includes all rate limit headers in 429 errors', async () => {
		const response: IN8nHttpFullResponse = {
			statusCode: 429,
			statusMessage: 'Too Many Requests',
			headers: {
				'Retry-After': '120',
				'X-Rate-Limit-Limit': '700',
				'X-Rate-Limit-Remaining': '0',
				'X-Rate-Limit-Reset': '1640995200',
				'X-Zendesk-Request-Id': 'req-456',
			},
			body: { error: 'Rate limit exceeded' },
		};

		try {
			await zendeskPostReceive.call(mockCtx, mockItems, response);
			expect.fail('Should have thrown NodeApiError');
		} catch (error) {
			expect(error).toBeInstanceOf(NodeApiError);
			if (error instanceof NodeApiError) {
				const errorResponse = (error as unknown as { response?: { headers?: IDataObject } })
					.response;
				if (errorResponse?.headers) {
					// Verify all rate limit related headers are captured
					expect(errorResponse.headers).toHaveProperty('Retry-After');
					expect(errorResponse.headers['Retry-After']).toBe('120');
					expect(errorResponse.headers).toHaveProperty('X-Rate-Limit-Limit');
					expect(errorResponse.headers).toHaveProperty('X-Rate-Limit-Remaining');
					expect(errorResponse.headers).toHaveProperty('X-Rate-Limit-Reset');
					expect(errorResponse.headers).toHaveProperty('X-Zendesk-Request-Id');
				}
			}
		}
	});
});

describe('prepareTicketCreate', () => {
	it('builds ticket body with required and optional fields', async () => {
		const ctx = mockCtx({
			description: 'Hello',
			jsonParameters: false,
			additionalFields: {
				subject: 'Test',
				status: 'new',
				type: 'question',
				tags: ['a', 'b'],
				customFieldsUi: {
					customFieldsValues: [{ id: 123, value: 'foo' }],
				},
				recipient: 'to@example.com',
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				subject: 'Test',
				comment: { body: 'Hello', public: true },
				status: 'new',
				type: 'question',
				tags: ['a', 'b'],
				custom_fields: [{ id: 123, value: 'foo' }],
				recipient: 'to@example.com',
			},
		});
	});

	it('handles minimal required fields (description only)', async () => {
		const ctx = mockCtx({
			description: 'Minimal ticket',
			jsonParameters: false,
			additionalFields: {},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				comment: { body: 'Minimal ticket', public: true },
			},
		});
	});

	it('handles tags as array', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				tags: ['tag1', 'tag2', 'tag3'],
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.tags).toEqual(['tag1', 'tag2', 'tag3']);
	});

	it('handles tags as comma-separated string', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				tags: 'tag1, tag2, tag3',
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.tags).toEqual(['tag1', 'tag2', 'tag3']);
	});

	it('filters out empty tags', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				tags: 'tag1, , tag2,  , tag3',
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.tags).toEqual(['tag1', 'tag2', 'tag3']);
	});

	it('handles empty customFieldsUi gracefully', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				customFieldsUi: {},
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.custom_fields).toBeUndefined();
	});

	it('handles multiple custom fields', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				customFieldsUi: {
					customFieldsValues: [
						{ id: 123, value: 'foo' },
						{ id: 456, value: 'bar' },
					],
				},
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.custom_fields).toEqual([
			{ id: 123, value: 'foo' },
			{ id: 456, value: 'bar' },
		]);
	});

	it('omits undefined optional fields', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.subject).toBeUndefined();
		expect(options.body.ticket.status).toBeUndefined();
		expect(options.body.ticket.type).toBeUndefined();
		expect(options.body.ticket.tags).toBeUndefined();
		expect(options.body.ticket.recipient).toBeUndefined();
	});

	it('handles externalId field', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				externalId: 'external-123',
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.external_id).toBe('external-123');
	});

	it('handles group field', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				group: '12345',
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.group_id).toBe(12345);
	});

	it('handles group field as number', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: false,
			additionalFields: {
				group: 67890,
			},
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.group_id).toBe(67890);
	});

	it('handles JSON parameters mode', async () => {
		const ctx = mockCtx({
			description: 'Test',
			jsonParameters: true,
			additionalFieldsJson: '{"subject":"From JSON","status":"open"}',
		});
		const options = await prepareTicketCreate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.subject).toBe('From JSON');
		expect(options.body.ticket.status).toBe('open');
		expect(options.body.ticket.comment).toEqual({ body: 'Test', public: true });
	});
});

describe('prepareTicketUpdate', () => {
	it('prefers public reply over internal note when both provided', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				internalNote: 'internal',
				publicReply: 'public',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				comment: { body: 'public', public: true },
			},
		});
	});

	it('handles internal note only', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				internalNote: 'internal note',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				comment: { body: 'internal note', public: false },
			},
		});
	});

	it('handles public reply only', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				publicReply: 'public reply',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				comment: { body: 'public reply', public: true },
			},
		});
	});

	it('handles update without comment', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				subject: 'Updated subject',
				status: 'solved',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				subject: 'Updated subject',
				status: 'solved',
			},
		});
		expect(options.body.ticket.comment).toBeUndefined();
	});

	it('handles all update fields together', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				subject: 'Updated',
				status: 'solved',
				publicReply: 'Fixed the issue',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body).toEqual({
			ticket: {
				subject: 'Updated',
				status: 'solved',
				comment: { body: 'Fixed the issue', public: true },
			},
		});
	});

	it('handles assigneeEmail field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				assigneeEmail: 'agent@example.com',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.assignee_email).toBe('agent@example.com');
	});

	it('handles externalId field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				externalId: 'external-456',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.external_id).toBe('external-456');
	});

	it('handles group field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				group: '12345',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.group_id).toBe(12345);
	});

	it('handles type field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				type: 'incident',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.type).toBe('incident');
	});

	it('handles tags field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				tags: ['tag1', 'tag2'],
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.tags).toEqual(['tag1', 'tag2']);
	});

	it('handles all update fields together', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				subject: 'Updated',
				status: 'solved',
				assigneeEmail: 'agent@example.com',
				externalId: 'ext-123',
				group: '456',
				type: 'task',
				tags: ['urgent', 'priority'],
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.assignee_email).toBe('agent@example.com');
		expect(options.body.ticket.external_id).toBe('ext-123');
		expect(options.body.ticket.group_id).toBe(456);
		expect(options.body.ticket.type).toBe('task');
		expect(options.body.ticket.tags).toEqual(['urgent', 'priority']);
	});

	it('handles custom fields in update', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				customFieldsUi: {
					customFieldsValues: [
						{ id: 123, value: 'foo' },
						{ id: 456, value: 'bar' },
					],
				},
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.custom_fields).toEqual([
			{ id: 123, value: 'foo' },
			{ id: 456, value: 'bar' },
		]);
	});

	it('handles JSON parameters mode', async () => {
		const ctx = mockCtx({
			jsonParameters: true,
			updateFieldsJson: '{"subject":"From JSON","status":"open"}',
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.subject).toBe('From JSON');
		expect(options.body.ticket.status).toBe('open');
	});

	it('handles recipient field', async () => {
		const ctx = mockCtx({
			jsonParameters: false,
			updateFields: {
				recipient: 'user@example.com',
			},
		});
		const options = await prepareTicketUpdate.call(
			ctx as unknown as IExecuteSingleFunctions,
			{} as IHttpRequestOptions,
		);
		expect(options.body.ticket.recipient).toBe('user@example.com');
	});
});

describe('ticketField resource', () => {
	it('has correct structure with get and getAll operations', () => {
		expect(ticketFieldDescription).toBeDefined();
		expect(Array.isArray(ticketFieldDescription)).toBe(true);

		const operationProperty = ticketFieldDescription.find((prop) => prop.name === 'operation');
		expect(operationProperty).toBeDefined();
		expect(operationProperty?.type).toBe('options');

		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{ name: string; value: string }>;
			expect(options).toBeDefined();
			expect(options.length).toBeGreaterThanOrEqual(2);

			const getOp = options.find((op) => op.value === 'get');
			const getAllOp = options.find((op) => op.value === 'getAll');

			expect(getOp).toBeDefined();
			expect(getAllOp).toBeDefined();
		}
	});

	it('has get operation with correct routing', () => {
		const operationProperty = ticketFieldDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const getOp = options.find((op) => op.value === 'get');
			expect(getOp?.routing?.request?.method).toBe('GET');
			expect(getOp?.routing?.request?.url).toContain('ticket_fields');
			expect(getOp?.routing?.request?.url).toContain('ticketFieldId');
		}
	});

	it('has getAll operation with correct routing', () => {
		const operationProperty = ticketFieldDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const getAllOp = options.find((op) => op.value === 'getAll');
			expect(getAllOp?.routing?.request?.method).toBe('GET');
			expect(getAllOp?.routing?.request?.url).toBe('/ticket_fields.json');
		}
	});

	it('has ticketFieldId parameter for get operation', () => {
		const ticketFieldIdProp = ticketFieldDescription.find((prop) => prop.name === 'ticketFieldId');
		expect(ticketFieldIdProp).toBeDefined();
		expect(ticketFieldIdProp?.type).toBe('string');
		expect(ticketFieldIdProp?.required).toBe(true);
	});

	it('has pagination parameters for getAll operation', () => {
		const returnAllProp = ticketFieldDescription.find((prop) => prop.name === 'returnAll');
		const limitProp = ticketFieldDescription.find((prop) => prop.name === 'limit');

		expect(returnAllProp).toBeDefined();
		expect(limitProp).toBeDefined();
		expect(returnAllProp?.type).toBe('boolean');
		expect(limitProp?.type).toBe('number');
	});
});

describe('user resource', () => {
	it('has correct structure with all operations', () => {
		expect(userDescription).toBeDefined();
		expect(Array.isArray(userDescription)).toBe(true);

		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		expect(operationProperty).toBeDefined();
		expect(operationProperty?.type).toBe('options');

		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{ name: string; value: string }>;
			expect(options.length).toBeGreaterThanOrEqual(8);

			const getOp = options.find((op) => op.value === 'get');
			const getAllOp = options.find((op) => op.value === 'getAll');
			const createOp = options.find((op) => op.value === 'create');
			const updateOp = options.find((op) => op.value === 'update');
			const deleteOp = options.find((op) => op.value === 'delete');
			const searchOp = options.find((op) => op.value === 'search');
			const getOrganizationsOp = options.find((op) => op.value === 'getOrganizations');
			const getRelatedDataOp = options.find((op) => op.value === 'getRelatedData');

			expect(getOp).toBeDefined();
			expect(getAllOp).toBeDefined();
			expect(createOp).toBeDefined();
			expect(updateOp).toBeDefined();
			expect(deleteOp).toBeDefined();
			expect(searchOp).toBeDefined();
			expect(getOrganizationsOp).toBeDefined();
			expect(getRelatedDataOp).toBeDefined();
		}
	});

	it('has get operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getOp = options.find((op) => op.value === 'get');
			expect(getOp?.routing?.request?.method).toBe('GET');
			expect(getOp?.routing?.request?.url).toBe('=/users/{{$parameter.userId}}.json');
			expect(getOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has getAll operation with correct routing, pagination, and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getAllOp = options.find((op) => op.value === 'getAll');
			expect(getAllOp?.routing?.request?.method).toBe('GET');
			expect(getAllOp?.routing?.request?.url).toBe('/users.json');
			expect(getAllOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getAllOp?.routing?.output?.postReceive)).toBe(true);
		}

		const returnAllProp = userDescription.find((prop) => prop.name === 'returnAll');
		const limitProp = userDescription.find((prop) => prop.name === 'limit');
		expect(returnAllProp).toBeDefined();
		expect(limitProp).toBeDefined();
	});

	it('has create operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const createOp = options.find((op) => op.value === 'create');
			expect(createOp?.routing?.request?.method).toBe('POST');
			expect(createOp?.routing?.request?.url).toBe('/users.json');
			expect(createOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(createOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has update operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const updateOp = options.find((op) => op.value === 'update');
			expect(updateOp?.routing?.request?.method).toBe('PUT');
			expect(updateOp?.routing?.request?.url).toBe('=/users/{{$parameter.userId}}.json');
			expect(updateOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(updateOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has delete operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const deleteOp = options.find((op) => op.value === 'delete');
			expect(deleteOp?.routing?.request?.method).toBe('DELETE');
			expect(deleteOp?.routing?.request?.url).toBe('=/users/{{$parameter.userId}}.json');
			expect(deleteOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(deleteOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has search operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const searchOp = options.find((op) => op.value === 'search');
			expect(searchOp?.routing?.request?.method).toBe('GET');
			expect(searchOp?.routing?.request?.url).toBe('/users/search.json');
			expect(searchOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(searchOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has getOrganizations operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getOrganizationsOp = options.find((op) => op.value === 'getOrganizations');
			expect(getOrganizationsOp?.routing?.request?.method).toBe('GET');
			expect(getOrganizationsOp?.routing?.request?.url).toBe(
				'=/users/{{$parameter.userId}}/organizations.json',
			);
			expect(getOrganizationsOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getOrganizationsOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has getRelatedData operation with correct routing and error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getRelatedDataOp = options.find((op) => op.value === 'getRelatedData');
			expect(getRelatedDataOp?.routing?.request?.method).toBe('GET');
			expect(getRelatedDataOp?.routing?.request?.url).toBe(
				'=/users/{{$parameter.userId}}/related.json',
			);
			expect(getRelatedDataOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getRelatedDataOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has userId parameter for get, update, delete, getOrganizations, and getRelatedData operations', () => {
		const userIdProp = userDescription.find((prop) => prop.name === 'userId');
		expect(userIdProp).toBeDefined();
		expect(userIdProp?.type).toBe('string');
	});

	it('has name parameter for create operation', () => {
		const nameProp = userDescription.find((prop) => prop.name === 'name');
		expect(nameProp).toBeDefined();
		expect(nameProp?.type).toBe('string');
	});

	it('has email parameter for create and update operations', () => {
		const emailProp = userDescription.find((prop) => prop.name === 'email');
		expect(emailProp).toBeDefined();
		expect(emailProp?.type).toBe('string');
	});

	it('has role parameter for create and update operations', () => {
		const roleProp = userDescription.find((prop) => prop.name === 'role');
		expect(roleProp).toBeDefined();
		expect(roleProp?.type).toBe('options');
	});

	it('has query parameter for search operation', () => {
		const queryProp = userDescription.find((prop) => prop.name === 'query');
		expect(queryProp).toBeDefined();
		expect(queryProp?.type).toBe('string');
		expect(queryProp?.required).toBe(true);
	});

	it('has all operations with postReceive error hook', () => {
		const operationProperty = userDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { output?: { postReceive?: unknown[] } };
			}>;
			options.forEach((op) => {
				expect(op.routing?.output?.postReceive).toBeDefined();
				expect(Array.isArray(op.routing?.output?.postReceive)).toBe(true);
				expect(op.routing?.output?.postReceive?.length).toBeGreaterThan(0);
			});
		}
	});
});

describe('organization resource', () => {
	it('has correct structure with all operations', () => {
		expect(organizationDescription).toBeDefined();
		expect(Array.isArray(organizationDescription)).toBe(true);

		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		expect(operationProperty).toBeDefined();
		expect(operationProperty?.type).toBe('options');

		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{ name: string; value: string }>;
			expect(options.length).toBeGreaterThanOrEqual(7);

			const countOp = options.find((op) => op.value === 'count');
			const getOp = options.find((op) => op.value === 'get');
			const getAllOp = options.find((op) => op.value === 'getAll');
			const createOp = options.find((op) => op.value === 'create');
			const updateOp = options.find((op) => op.value === 'update');
			const deleteOp = options.find((op) => op.value === 'delete');
			const getRelatedDataOp = options.find((op) => op.value === 'getRelatedData');

			expect(countOp).toBeDefined();
			expect(getOp).toBeDefined();
			expect(getAllOp).toBeDefined();
			expect(createOp).toBeDefined();
			expect(updateOp).toBeDefined();
			expect(deleteOp).toBeDefined();
			expect(getRelatedDataOp).toBeDefined();
		}
	});

	it('has count operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const countOp = options.find((op) => op.value === 'count');
			expect(countOp?.routing?.request?.method).toBe('GET');
			expect(countOp?.routing?.request?.url).toBe('/organizations/count.json');
			expect(countOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(countOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has get operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getOp = options.find((op) => op.value === 'get');
			expect(getOp?.routing?.request?.method).toBe('GET');
			expect(getOp?.routing?.request?.url).toBe('=/organizations/{{$parameter.organizationId}}.json');
			expect(getOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has getAll operation with correct routing, pagination, and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getAllOp = options.find((op) => op.value === 'getAll');
			expect(getAllOp?.routing?.request?.method).toBe('GET');
			expect(getAllOp?.routing?.request?.url).toBe('/organizations.json');
			expect(getAllOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getAllOp?.routing?.output?.postReceive)).toBe(true);
		}

		const returnAllProp = organizationDescription.find((prop) => prop.name === 'returnAll');
		const limitProp = organizationDescription.find((prop) => prop.name === 'limit');
		expect(returnAllProp).toBeDefined();
		expect(limitProp).toBeDefined();
	});

	it('has create operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const createOp = options.find((op) => op.value === 'create');
			expect(createOp?.routing?.request?.method).toBe('POST');
			expect(createOp?.routing?.request?.url).toBe('/organizations.json');
			expect(createOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(createOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has update operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const updateOp = options.find((op) => op.value === 'update');
			expect(updateOp?.routing?.request?.method).toBe('PUT');
			expect(updateOp?.routing?.request?.url).toBe('=/organizations/{{$parameter.organizationId}}.json');
			expect(updateOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(updateOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has delete operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const deleteOp = options.find((op) => op.value === 'delete');
			expect(deleteOp?.routing?.request?.method).toBe('DELETE');
			expect(deleteOp?.routing?.request?.url).toBe('=/organizations/{{$parameter.organizationId}}.json');
			expect(deleteOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(deleteOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has getRelatedData operation with correct routing and error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const getRelatedDataOp = options.find((op) => op.value === 'getRelatedData');
			expect(getRelatedDataOp?.routing?.request?.method).toBe('GET');
			expect(getRelatedDataOp?.routing?.request?.url).toBe(
				'=/organizations/{{$parameter.organizationId}}/related.json',
			);
			expect(getRelatedDataOp?.routing?.output?.postReceive).toBeDefined();
			expect(Array.isArray(getRelatedDataOp?.routing?.output?.postReceive)).toBe(true);
		}
	});

	it('has organizationId parameter for get, update, delete, and getRelatedData operations', () => {
		const organizationIdProp = organizationDescription.find((prop) => prop.name === 'organizationId');
		expect(organizationIdProp).toBeDefined();
		expect(organizationIdProp?.type).toBe('string');
		expect(organizationIdProp?.required).toBe(true);
	});

	it('has name parameter for create and update operations', () => {
		const nameProp = organizationDescription.find((prop) => prop.name === 'name');
		expect(nameProp).toBeDefined();
		expect(nameProp?.type).toBe('string');
	});

	it('has all operations with postReceive error hook', () => {
		const operationProperty = organizationDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { output?: { postReceive?: unknown[] } };
			}>;
			options.forEach((op) => {
				expect(op.routing?.output?.postReceive).toBeDefined();
				expect(Array.isArray(op.routing?.output?.postReceive)).toBe(true);
				expect(op.routing?.output?.postReceive?.length).toBeGreaterThan(0);
			});
		}
	});
});

describe('ticket resource', () => {
	it('has correct structure with all operations', () => {
		expect(ticketDescription).toBeDefined();
		expect(Array.isArray(ticketDescription)).toBe(true);

		const operationProperty = ticketDescription.find((prop) => prop.name === 'operation');
		expect(operationProperty).toBeDefined();
		expect(operationProperty?.type).toBe('options');

		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{ name: string; value: string }>;
			expect(options.length).toBeGreaterThanOrEqual(5);

			const createOp = options.find((op) => op.value === 'create');
			const getOp = options.find((op) => op.value === 'get');
			const getAllOp = options.find((op) => op.value === 'getAll');
			const updateOp = options.find((op) => op.value === 'update');
			const deleteOp = options.find((op) => op.value === 'delete');

			expect(createOp).toBeDefined();
			expect(getOp).toBeDefined();
			expect(getAllOp).toBeDefined();
			expect(updateOp).toBeDefined();
			expect(deleteOp).toBeDefined();
		}
	});

	it('has create operation with preSend hook', () => {
		const operationProperty = ticketDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					send?: { preSend?: unknown[] };
					output?: { postReceive?: unknown[] };
				};
			}>;
			const createOp = options.find((op) => op.value === 'create');
			expect(createOp?.routing?.request?.method).toBe('POST');
			expect(createOp?.routing?.request?.url).toBe('/tickets.json');
			expect(createOp?.routing?.send?.preSend).toBeDefined();
			expect(Array.isArray(createOp?.routing?.send?.preSend)).toBe(true);
			expect(createOp?.routing?.output?.postReceive).toBeDefined();
		}
	});

	it('has update operation with preSend hook', () => {
		const operationProperty = ticketDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: {
					request?: { method?: string; url?: string };
					send?: { preSend?: unknown[] };
				};
			}>;
			const updateOp = options.find((op) => op.value === 'update');
			expect(updateOp?.routing?.request?.method).toBe('PUT');
			expect(updateOp?.routing?.request?.url).toContain('tickets');
			expect(updateOp?.routing?.send?.preSend).toBeDefined();
		}
	});

	it('has all operations with postReceive error hook', () => {
		const operationProperty = ticketDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { output?: { postReceive?: unknown[] } };
			}>;
			options.forEach((op) => {
				if (op.routing?.output?.postReceive) {
					expect(Array.isArray(op.routing.output.postReceive)).toBe(true);
					expect(op.routing.output.postReceive.length).toBeGreaterThan(0);
				}
			});
		}
	});

	it('has required id parameter for get, update, delete operations', () => {
		const idProp = ticketDescription.find((prop) => prop.name === 'id');
		expect(idProp).toBeDefined();
		expect(idProp?.type).toBe('string');
		expect(idProp?.required).toBe(true);
	});

	it('has description parameter for create operation', () => {
		const descProp = ticketDescription.find((prop) => prop.name === 'description');
		expect(descProp).toBeDefined();
		expect(descProp?.type).toBe('string');
		expect(descProp?.required).toBe(true);
	});
});

describe('view resource', () => {
	it('has correct structure with get, getAll, and getTickets operations', () => {
		expect(viewDescription).toBeDefined();
		expect(Array.isArray(viewDescription)).toBe(true);

		const operationProperty = viewDescription.find((prop) => prop.name === 'operation');
		expect(operationProperty).toBeDefined();
		expect(operationProperty?.type).toBe('options');

		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{ name: string; value: string }>;
			expect(options.length).toBeGreaterThanOrEqual(3);

			const getOp = options.find((op) => op.value === 'get');
			const getAllOp = options.find((op) => op.value === 'getAll');
			const getTicketsOp = options.find((op) => op.value === 'getTickets');

			expect(getOp).toBeDefined();
			expect(getAllOp).toBeDefined();
			expect(getTicketsOp).toBeDefined();
		}
	});

	it('has all operations with postReceive error hook', () => {
		const operationProperty = viewDescription.find((prop) => prop.name === 'operation');
		if (operationProperty && 'options' in operationProperty) {
			const options = operationProperty.options as Array<{
				value: string;
				routing?: { output?: { postReceive?: unknown[] } };
			}>;
			options.forEach((op) => {
				expect(op.routing?.output?.postReceive).toBeDefined();
				expect(Array.isArray(op.routing?.output?.postReceive)).toBe(true);
			});
		}
	});

	it('has viewId parameter for get and getTickets operations', () => {
		const viewIdProp = viewDescription.find((prop) => prop.name === 'viewId');
		expect(viewIdProp).toBeDefined();
		expect(viewIdProp?.type).toBe('string');
		expect(viewIdProp?.required).toBe(true);
	});

	it('has pagination parameters for getAll and getTickets operations', () => {
		const returnAllProp = viewDescription.find((prop) => prop.name === 'returnAll');
		const limitProp = viewDescription.find((prop) => prop.name === 'limit');

		expect(returnAllProp).toBeDefined();
		expect(limitProp).toBeDefined();
		expect(returnAllProp?.type).toBe('boolean');
		expect(limitProp?.type).toBe('number');
	});
});

describe('BetterZendeskApi credentials', () => {
	it('has correct credential structure', () => {
		const creds = new BetterZendeskApi();
		expect(creds.name).toBe('betterZendeskApi');
		expect(creds.displayName).toBe('Better Zendesk API');
		expect(creds.properties).toBeDefined();
		expect(Array.isArray(creds.properties)).toBe(true);
	});

	it('has required credential properties', () => {
		const creds = new BetterZendeskApi();
		const subdomainProp = creds.properties.find((prop) => prop.name === 'subdomain');
		const emailProp = creds.properties.find((prop) => prop.name === 'email');
		const apiTokenProp = creds.properties.find((prop) => prop.name === 'apiToken');

		expect(subdomainProp).toBeDefined();
		expect(emailProp).toBeDefined();
		expect(apiTokenProp).toBeDefined();

		expect(subdomainProp?.required).toBe(true);
		expect(emailProp?.required).toBe(true);
		expect(apiTokenProp?.required).toBe(true);
	});

	it('has correct authentication configuration', () => {
		const creds = new BetterZendeskApi();
		expect(creds.authenticate).toBeDefined();
		expect(creds.authenticate.type).toBe('generic');
		expect(creds.authenticate.properties.auth).toBeDefined();
		expect(creds.authenticate.properties.auth.username).toContain('email');
		expect(creds.authenticate.properties.auth.password).toContain('apiToken');
	});

	it('has credential test configuration', () => {
		const creds = new BetterZendeskApi();
		expect(creds.test).toBeDefined();
		expect(creds.test.request).toBeDefined();
		expect(creds.test.request.baseURL).toContain('subdomain');
		expect(creds.test.request.url).toBe('/tickets.json');
	});
});

describe('BetterZendesk node', () => {
	it('has correct node structure', () => {
		const node = new BetterZendesk();
		expect(node.description).toBeDefined();
		expect(node.description.displayName).toBe('Better Zendesk');
		expect(node.description.name).toBe('betterZendesk');
		expect(node.description.group).toContain('transform');
		expect(node.description.version).toBe(1);
	});

	it('includes all resources in resource options', () => {
		const node = new BetterZendesk();
		const resourceProperty = node.description.properties.find((prop) => prop.name === 'resource');
		expect(resourceProperty).toBeDefined();

		if (resourceProperty && 'options' in resourceProperty) {
			const options = resourceProperty.options as Array<{ name: string; value: string }>;
			const resourceValues = options.map((opt) => opt.value);

			expect(resourceValues).toContain('user');
			expect(resourceValues).toContain('organization');
			expect(resourceValues).toContain('ticket');
			expect(resourceValues).toContain('ticketField');
			expect(resourceValues).toContain('view');
		}
	});

	it('includes all resource descriptions in properties', () => {
		const node = new BetterZendesk();
		const hasUserProps = node.description.properties.some(
			(prop) => prop.displayOptions?.show?.resource?.includes('user'),
		);
		const hasOrganizationProps = node.description.properties.some(
			(prop) => prop.displayOptions?.show?.resource?.includes('organization'),
		);
		const hasTicketProps = node.description.properties.some(
			(prop) => prop.displayOptions?.show?.resource?.includes('ticket'),
		);
		const hasTicketFieldProps = node.description.properties.some(
			(prop) => prop.displayOptions?.show?.resource?.includes('ticketField'),
		);
		const hasViewProps = node.description.properties.some(
			(prop) => prop.displayOptions?.show?.resource?.includes('view'),
		);

		expect(hasUserProps).toBe(true);
		expect(hasOrganizationProps).toBe(true);
		expect(hasTicketProps).toBe(true);
		expect(hasTicketFieldProps).toBe(true);
		expect(hasViewProps).toBe(true);
	});

	it('has correct credentials configuration', () => {
		const node = new BetterZendesk();
		expect(node.description.credentials).toBeDefined();
		expect(Array.isArray(node.description.credentials)).toBe(true);
		expect(node.description.credentials.length).toBe(1);
		expect(node.description.credentials[0].name).toBe('betterZendeskApi');
		expect(node.description.credentials[0].required).toBe(true);
	});

	it('has correct request defaults', () => {
		const node = new BetterZendesk();
		expect(node.description.requestDefaults).toBeDefined();
		expect(node.description.requestDefaults?.baseURL).toContain('subdomain');
		expect(node.description.requestDefaults?.baseURL).toContain('zendesk.com');
		expect(node.description.requestDefaults?.headers).toBeDefined();
		expect(node.description.requestDefaults?.headers?.Accept).toBe('application/json');
		expect(node.description.requestDefaults?.resolveWithFullResponse).toBe(true);
	});
});
