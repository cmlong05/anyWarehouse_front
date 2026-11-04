export interface StorageMutationFormValues {
	item: string;
	container: string;
	quantity: string;
	text: string;
	sample: boolean;
	is_locked: boolean;
}

export function buildStorageMutationData(values: StorageMutationFormValues) {
	return {
		item: Number(values.item),
		container: Number(values.container),
		quantity: Number(values.quantity),
		text: values.text || '',
		sample: values.sample,
		is_locked: values.is_locked,
	};
}
