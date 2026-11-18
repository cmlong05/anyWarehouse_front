export interface EditableShipmentQuantityInput {
	orderQuantity: number;
	quantityInShipments: number;
	currentShipmentQuantity: number;
}

export interface BatchAddableShipmentOrderItem {
	quantity_pending_real?: number | string | null;
}

export function getBatchAddableOrderItems<T extends BatchAddableShipmentOrderItem>(
	items: readonly T[],
): T[] {
	return items.filter((item) => Number(item.quantity_pending_real ?? 0) > 0);
}

export function getMaxEditableShipmentQuantity({
	orderQuantity,
	quantityInShipments,
	currentShipmentQuantity,
}: EditableShipmentQuantityInput): number {
	const otherShipmentQuantity = Math.max(
		0,
		quantityInShipments - currentShipmentQuantity,
	);
	return Math.max(0, orderQuantity - otherShipmentQuantity);
}
