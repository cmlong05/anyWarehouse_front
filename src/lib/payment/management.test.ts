// @ts-expect-error Bun supplies this module at test runtime.
import { describe, expect, test } from 'bun:test';

import {
	buildPaymentRecordQuery,
	getPaymentAmountError,
} from './management';

describe('buildPaymentRecordQuery', () => {
	test('maps receivable filters to customer fields', () => {
		const query = buildPaymentRecordQuery(
			'receivable',
			{
				partnerId: '12',
				search: 'SO-001',
				paymentMethod: 'bank',
				dateFrom: '2026-04-01',
				dateTo: '2026-04-30',
			},
			{ page: 2, pageSize: 20 }
		);

		expect(query).toEqual({
			customer_id: '12',
			search: 'SO-001',
			payment_method: 'bank',
			date_from: '2026-04-01',
			date_to: '2026-04-30',
			page: 2,
			page_size: 20,
		});
	});

	test('maps payable filters to supplier fields', () => {
		const query = buildPaymentRecordQuery(
			'payable',
			{ partnerId: '9', search: 'PO-001' },
			{ page: 1, pageSize: 20 }
		);

		expect(query).toEqual({
			supplier_id: '9',
			search: 'PO-001',
			page: 1,
			page_size: 20,
		});
	});
});

describe('getPaymentAmountError', () => {
	test('allows receivable refunds while rejecting non-finite values', () => {
		expect(getPaymentAmountError('receivable', -20)).toBeNull();
		expect(getPaymentAmountError('receivable', 0)).toBeNull();
		expect(getPaymentAmountError('receivable', Number.NaN)).toBe(
			'请输入有效的收款金额'
		);
	});

	test('requires payable amounts of at least one cent', () => {
		expect(getPaymentAmountError('payable', 0.01)).toBeNull();
		expect(getPaymentAmountError('payable', 0)).toBe(
			'付款金额必须大于等于 0.01'
		);
	});
});
