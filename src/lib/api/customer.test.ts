// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { CustomerQuotationAPI } from './customer';

describe('CustomerQuotationAPI versions', () => {
	test('loads and creates versions at the customer quotation endpoint', async () => {
		const api = new CustomerQuotationAPI();
		const calls: Array<{ method: string; url: string; body?: unknown }> = [];
		(api as unknown as { client: unknown }).client = {
			get: async (url: string) => {
				calls.push({ method: 'GET', url });
				return { quotation_id: 207, versions: [], count: 0 };
			},
			post: async (url: string, body: unknown) => {
				calls.push({ method: 'POST', url, body });
				return { id: 207, price: '12.50' };
			},
		};

		await api.getVersions(207);
		await api.createVersion(207, { price: '12.50', note: 'raise' });

		expect(calls).toEqual([
			{
				method: 'GET',
				url: '/customer/customer-quotation/207/versions/',
			},
			{
				method: 'POST',
				url: '/customer/customer-quotation/207/versions/',
				body: { price: '12.50', note: 'raise' },
			},
		]);
	});
});
