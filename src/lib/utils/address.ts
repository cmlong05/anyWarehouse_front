export interface AddressLike {
    country?: string | null;
    province?: string | null;
    city?: string | null;
    district?: string | null;
    county?: string | null;
    postal_code?: string | null;
    detail_address?: string | null;
    detail_address2?: string | null;
}

export function normalizeAddressValue(value: string | null | undefined): string {
    return (value || '').trim().replace(/\s+/g, ' ');
}

function joinAddressParts(parts: Array<string | null | undefined>): string {
    return parts.map(normalizeAddressValue).filter(Boolean).join(', ');
}

export function formatAddressLocationLine(address: AddressLike): string {
    return joinAddressParts([
        address.district || address.county,
        address.city,
        address.province,
    ]);
}

export function formatAddressPostalLine(address: AddressLike): string {
    return joinAddressParts([
        address.country,
        address.postal_code,
    ]);
}

export function formatAddressInline(address: AddressLike): string {
    return [
        normalizeAddressValue(address.detail_address),
        normalizeAddressValue(address.detail_address2),
        formatAddressLocationLine(address),
        formatAddressPostalLine(address),
    ].filter(Boolean).join(', ');
}

export function addressMatches(address: AddressLike, expectedAddress: string | null | undefined): boolean {
    const normalizedExpected = normalizeAddressValue(expectedAddress);
    if (!normalizedExpected) return false;
    return formatAddressInline(address) === normalizedExpected;
}
