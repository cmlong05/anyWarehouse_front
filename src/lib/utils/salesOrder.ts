import { safeParseFloat } from './base';

const PRUNABLE_ORDER_STATUSES = new Set([
	'draft',
	'pending',
	'approved',
	'confirmed',
	'partial',
]);

export function canPruneZeroOrderItem(
	item: {
		quantity?: string | number | null;
		quantity_processed?: string | number | null;
		quantity_in_shipments?: string | number | null;
	},
	orderStatus: string,
): boolean {
	return (
		PRUNABLE_ORDER_STATUSES.has(orderStatus) &&
		safeParseFloat(item.quantity) === 0 &&
		safeParseFloat(item.quantity_processed) === 0 &&
		safeParseFloat(item.quantity_in_shipments) === 0
	);
}
