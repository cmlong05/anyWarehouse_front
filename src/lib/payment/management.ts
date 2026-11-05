export type PaymentManagementMode = 'receivable' | 'payable';

export interface PaymentRecordFilters {
	partnerId?: string;
	search?: string;
	paymentMethod?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface PaymentRecordPagination {
	page: number;
	pageSize: number;
}

export function buildPaymentRecordQuery(
	mode: PaymentManagementMode,
	filters: PaymentRecordFilters,
	pagination: PaymentRecordPagination
): Record<string, string | number> {
	const query: Record<string, string | number> = {
		page: pagination.page,
		page_size: pagination.pageSize,
	};

	if (filters.partnerId) {
		query[mode === 'receivable' ? 'customer_id' : 'supplier_id'] = filters.partnerId;
	}
	if (filters.search) query.search = filters.search;
	if (filters.paymentMethod) query.payment_method = filters.paymentMethod;
	if (filters.dateFrom) query.date_from = filters.dateFrom;
	if (filters.dateTo) query.date_to = filters.dateTo;

	return query;
}

export function getPaymentAmountError(
	mode: PaymentManagementMode,
	amount: number
): string | null {
	if (!Number.isFinite(amount)) {
		return mode === 'receivable' ? '请输入有效的收款金额' : '请输入有效的付款金额';
	}
	if (mode === 'payable' && amount < 0.01) {
		return '付款金额必须大于等于 0.01';
	}
	return null;
}
