import { safeParseFloat } from './base';

const PRUNABLE_ORDER_STATUSES = new Set([
	'draft',
	'pending',
	'approved',
	'confirmed',
	'partial',
]);

export function canReverseSyncOrderItem(item: {
	quantity?: string | number | null;
	quantity_processed?: string | number | null;
	quantity_in_shipments?: string | number | null;
}): boolean {
	const shipmentPlanned = safeParseFloat(item.quantity_in_shipments ?? item.quantity_processed);
	return shipmentPlanned > 0 && shipmentPlanned !== safeParseFloat(item.quantity);
}

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
