export interface StorageLockState {
	is_locked?: boolean;
	quantity: number;
}

export function canOutboundStorage(storage: StorageLockState): boolean {
	return storage.quantity > 0 && !storage.is_locked;
}
