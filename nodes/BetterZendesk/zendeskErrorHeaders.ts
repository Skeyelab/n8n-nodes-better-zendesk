import type { IDataObject, IExecuteSingleFunctions, INodeExecutionData, IN8nHttpFullResponse } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

// Headers that are safe to expose in errors and useful for retry logic
// - retry-after: Critical for 429 rate limit errors, indicates seconds to wait before retry
// - x-rate-limit-*: Rate limit information (limit, remaining, reset)
// - x-zendesk-request-id: Request ID for debugging
const ALLOWED_HEADER_PREFIXES = ['x-rate-limit', 'x-zendesk-request-id', 'retry-after'];

/**
 * Filters and extracts only safe, useful headers from Zendesk API responses.
 * Specifically captures retry-after header which is critical for handling 429 rate limit errors.
 * Headers are preserved with their original case for consistency.
 *
 * @param headers - Response headers object
 * @returns Filtered headers object containing only allowed headers
 */
export const pickZendeskErrorHeaders = (headers: IDataObject = {}) => {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(headers)) {
		const lower = key.toLowerCase();
		if (ALLOWED_HEADER_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
			result[key] = value;
		}
	}
	return result;
};

/**
 * Post-receive hook that processes API responses and throws errors with useful headers.
 * For 429 rate limit errors, the Retry-After header is included in the error,
 * allowing workflows to implement retry logic with proper backoff timing.
 *
 * Headers are accessible in the error object via error.response.headers
 * Example: error.response.headers['Retry-After'] contains seconds to wait before retry
 *
 * @param this - Execution context
 * @param items - Execution data items
 * @param response - Full HTTP response from Zendesk API
 * @returns Items if successful, throws NodeApiError with headers if error
 */
export async function zendeskPostReceive(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
) {
	if (response.statusCode >= 400) {
		const headers = pickZendeskErrorHeaders(response.headers);
		throw new NodeApiError(
			this.getNode(),
			{
				statusCode: response.statusCode,
				statusMessage: response.statusMessage ?? '',
				headers: headers as Record<string, string>,
				// @ts-expect-error - body can be various types but NodeApiError accepts it
				body: response.body,
			},
			{ httpCode: response.statusCode?.toString() },
		);
	}

	return items;
}
