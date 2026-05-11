import type { Item, QuotationBrief } from '$lib';

export interface PricePoint {
    price: string | number;
    currency: string;
    supplierName?: string;
}

export interface ItemDisplayPrice {
    primaryPrice: string | number;
    primaryCurrency: string;
    source: 'preferred' | 'item' | 'highest' | 'none';
    supplierName: string;
    local: PricePoint | null;
    preferred: PricePoint | null;
    highest: PricePoint | null;
    showHighest: boolean;
}

function normalizePrice(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = parseFloat(String(value));
    return Number.isNaN(n) ? null : n;
}

/**
 * Resolves all price fields needed by item detail UI from quotations + item local price.
 *
 * Primary fallback order:
 * 1) preferred quotation
 * 2) item local price
 * 3) highest quotation price
 * 4) none
 *
 * showHighest is false when highest equals preferred (same numeric price and currency)
 * to avoid rendering duplicate cards.
 */
export function resolveItemDisplayPrice(quotations: QuotationBrief[], item: Item): ItemDisplayPrice {
    const preferred = quotations.find(
        (q) => q.is_preferred === true || String(q.is_preferred).toLowerCase() === 'true'
    );

    const preferredPriceNum = normalizePrice(preferred?.price);
    const preferredPoint: PricePoint | null = preferredPriceNum !== null
        ? {
            price: preferred!.price,
            currency: preferred!.currency || 'CNY',
            supplierName: preferred!.supplier_name || '',
        }
        : null;

    const itemPriceNum = normalizePrice(item.b_Price);
    const localPoint: PricePoint | null = itemPriceNum !== null
        ? {
            price: item.b_Price,
            currency: item.currency || 'CNY',
        }
        : null;

    const quotationsWithPrice = quotations.filter((q) => {
        return normalizePrice(q.price) !== null;
    });

    let highestPoint: PricePoint | null = null;
    if (quotationsWithPrice.length > 0) {
        const highestQuotation = quotationsWithPrice.reduce((maxQ, currentQ) => {
            const current = normalizePrice(currentQ.price) ?? Number.NEGATIVE_INFINITY;
            const max = normalizePrice(maxQ.price) ?? Number.NEGATIVE_INFINITY;
            return current > max ? currentQ : maxQ;
        });

        highestPoint = {
            price: highestQuotation.price,
            currency: highestQuotation.currency || 'CNY',
            supplierName: highestQuotation.supplier_name || '',
        };
    }

    const preferredNum = normalizePrice(preferredPoint?.price);
    const highestNum = normalizePrice(highestPoint?.price);
    const isPreferredSameAsHighest =
        preferredPoint !== null &&
        highestPoint !== null &&
        preferredNum !== null &&
        highestNum !== null &&
        preferredNum === highestNum &&
        (preferredPoint.currency || 'CNY') === (highestPoint.currency || 'CNY');

    const showHighest = highestPoint !== null && !isPreferredSameAsHighest;

    if (preferredPoint) {
        return {
            primaryPrice: preferredPoint.price,
            primaryCurrency: preferredPoint.currency,
            source: 'preferred',
            supplierName: preferredPoint.supplierName || '',
            local: localPoint,
            preferred: preferredPoint,
            highest: highestPoint,
            showHighest,
        };
    }

    if (localPoint) {
        return {
            primaryPrice: localPoint.price,
            primaryCurrency: localPoint.currency,
            source: 'item',
            supplierName: '',
            local: localPoint,
            preferred: null,
            highest: highestPoint,
            showHighest,
        };
    }

    if (highestPoint) {
        return {
            primaryPrice: highestPoint.price,
            primaryCurrency: highestPoint.currency,
            source: 'highest',
            supplierName: highestPoint.supplierName || '',
            local: null,
            preferred: null,
            highest: highestPoint,
            showHighest: true,
        };
    }

    return {
        primaryPrice: '-',
        primaryCurrency: '',
        source: 'none',
        supplierName: '',
        local: null,
        preferred: null,
        highest: null,
        showHighest: false,
    };
}
