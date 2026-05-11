import type { Item, QuotationBrief } from '$lib';

export interface ItemDisplayPrice {
    price: string | number;
    currency: string;
    source: 'preferred' | 'item' | 'highest' | 'none';
    supplierName: string;
}

export function resolveItemDisplayPrice(quotations: QuotationBrief[], item: Item): ItemDisplayPrice {
    const preferred = quotations.find(
        (q) => q.is_preferred === true || String(q.is_preferred).toLowerCase() === 'true'
    );
    if (preferred && preferred.price !== null && preferred.price !== undefined && preferred.price !== '') {
        return {
            price: preferred.price,
            currency: preferred.currency || 'CNY',
            source: 'preferred',
            supplierName: preferred.supplier_name || '',
        };
    }

    const itemPrice = item.b_Price;
    if (itemPrice && itemPrice !== '' && itemPrice !== '0' && itemPrice !== '0.00') {
        return {
            price: itemPrice,
            currency: item.currency || 'CNY',
            source: 'item',
            supplierName: '',
        };
    }

    const quotationsWithPrice = quotations.filter((q) => {
        const p = q.price;
        return p !== null && p !== undefined && p !== '' && !Number.isNaN(parseFloat(String(p)));
    });
    if (quotationsWithPrice.length > 0) {
        const highestQuotation = quotationsWithPrice.reduce((maxQ, currentQ) =>
            parseFloat(String(currentQ.price)) > parseFloat(String(maxQ.price)) ? currentQ : maxQ
        );
        return {
            price: highestQuotation.price,
            currency: highestQuotation.currency || 'CNY',
            source: 'highest',
            supplierName: highestQuotation.supplier_name || '',
        };
    }

    return { price: '-', currency: '', source: 'none', supplierName: '' };
}
