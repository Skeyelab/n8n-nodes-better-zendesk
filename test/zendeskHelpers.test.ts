/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';
import type { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { pickZendeskErrorHeaders } from '../nodes/BetterZendesk/zendeskErrorHeaders';
import { prepareTicketCreate, prepareTicketUpdate } from '../nodes/BetterZendesk/resources/ticket/helpers';

type MockCtx = {
	getNodeParameter: (name: string, index: number, defaultValue?: unknown) => unknown;
};

const mockCtx = (params: Record<string, unknown>): MockCtx => ({
	getNodeParameter: (name: string, _index: number, defaultValue?: unknown) =>
		name in params ? params[name] : defaultValue,
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
});

describe('prepareTicketCreate', () => {
	it('builds ticket body with required and optional fields', async () => {
		const ctx = mockCtx({
			subject: 'Test',
			description: 'Hello',
			status: 'new',
			type: 'question',
			tags: 'a,b',
			customFields: '[{"id":123,"value":"foo"}]',
			recipient: 'to@example.com',
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
});

describe('prepareTicketUpdate', () => {
	it('prefers internal note over public reply when both provided', async () => {
		const ctx = mockCtx({
			internalNote: 'internal',
			publicReply: 'public',
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
});
