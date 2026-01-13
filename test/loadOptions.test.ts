/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it, vi } from 'vitest';
import { BetterZendesk } from '../nodes/BetterZendesk/BetterZendesk.node';
import type { ILoadOptionsFunctions } from 'n8n-workflow';

describe('BetterZendesk Load Options', () => {
	const node = new BetterZendesk();

	it('has methods.loadOptions defined', () => {
		expect(node.methods).toBeDefined();
		expect(node.methods.loadOptions).toBeDefined();
	});

	it('has all 7 required load option methods', () => {
		const loadOptions = node.methods.loadOptions;
		expect(loadOptions).toBeDefined();
		
		expect(typeof loadOptions.getCustomFields).toBe('function');
		expect(typeof loadOptions.getGroups).toBe('function');
		expect(typeof loadOptions.getTags).toBe('function');
		expect(typeof loadOptions.getLocales).toBe('function');
		expect(typeof loadOptions.getUserFields).toBe('function');
		expect(typeof loadOptions.getOrganizationFields).toBe('function');
		expect(typeof loadOptions.getOrganizations).toBe('function');
	});

	describe('getCustomFields', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getCustomFields.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						ticket_fields: [
							{ id: 1, title: 'Priority', type: 'custom' },
							{ id: 2, title: 'Category', type: 'custom' },
							{ id: 3, title: 'Status', type: 'system' }, // Should be filtered out
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getCustomFields.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'Priority', value: 1 });
			expect(result[1]).toEqual({ name: 'Category', value: 2 });
		});
	});

	describe('getGroups', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getGroups.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						groups: [
							{ id: 100, name: 'Support Team' },
							{ id: 101, name: 'Sales Team' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getGroups.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'Support Team', value: 100 });
			expect(result[1]).toEqual({ name: 'Sales Team', value: 101 });
		});
	});

	describe('getTags', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getTags.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						tags: [
							{ name: 'urgent' },
							{ name: 'customer-inquiry' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getTags.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'urgent', value: 'urgent' });
			expect(result[1]).toEqual({ name: 'customer-inquiry', value: 'customer-inquiry' });
		});
	});

	describe('getLocales', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getLocales.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						locales: [
							{ id: 1, name: 'English (United States)' },
							{ id: 2, name: 'Spanish (Spain)' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getLocales.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'English (United States)', value: 1 });
			expect(result[1]).toEqual({ name: 'Spanish (Spain)', value: 2 });
		});
	});

	describe('getUserFields', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getUserFields.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						user_fields: [
							{ id: 10, title: 'Department' },
							{ id: 11, title: 'Employee ID' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getUserFields.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'Department', value: 10 });
			expect(result[1]).toEqual({ name: 'Employee ID', value: 11 });
		});
	});

	describe('getOrganizationFields', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getOrganizationFields.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						organization_fields: [
							{ id: 20, title: 'Industry' },
							{ id: 21, title: 'Company Size' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getOrganizationFields.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'Industry', value: 20 });
			expect(result[1]).toEqual({ name: 'Company Size', value: 21 });
		});
	});

	describe('getOrganizations', () => {
		it('returns empty array on API error', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockRejectedValue(new Error('API Error')),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getOrganizations.call(mockContext);
			expect(result).toEqual([]);
		});

		it('returns formatted options on success', async () => {
			const mockContext = {
				getCredentials: vi.fn().mockResolvedValue({ subdomain: 'test' }),
				helpers: {
					httpRequest: vi.fn().mockResolvedValue({
						organizations: [
							{ id: 1000, name: 'Acme Corp' },
							{ id: 1001, name: 'Widget Inc' },
						],
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const result = await node.methods.loadOptions.getOrganizations.call(mockContext);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ name: 'Acme Corp', value: 1000 });
			expect(result[1]).toEqual({ name: 'Widget Inc', value: 1001 });
		});
	});
});
