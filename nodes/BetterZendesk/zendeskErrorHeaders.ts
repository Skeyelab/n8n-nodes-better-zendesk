import type { IDataObject, IExecuteSingleFunctions, INodeExecutionData, IN8nHttpFullResponse } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const ALLOWED_HEADER_PREFIXES = ['x-rate-limit', 'x-zendesk-request-id', 'retry-after'];

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
				statusMessage: response.statusMessage,
				headers,
				body: response.body,
			},
			{ httpCode: response.statusCode?.toString() },
		);
	}

	return items;
}
