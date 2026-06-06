import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = new URL('../src/', import.meta.url).pathname;

function collectSourceFiles(dir) {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const abs = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectSourceFiles(abs));
			continue;
		}
		if (entry.isFile() && (entry.name.endsWith('.svelte') || entry.name.endsWith('.ts'))) {
			files.push(abs);
		}
	}

	return files;
}

function toRelative(absPath) {
	return absPath.replace(srcRoot, '').replace(/^\/+/, '');
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const enforcedComponents = [
	'Alert',
	'Loading',
	'LogisticsStatusBadge',
	'PackageStatusBadge',
	'ShipmentStatusBadge',
	'ConfirmModal',
	'Breadcrumb',
	'ItemForm',
	'SupplierForm',
	'CustomerForm',
	'PurchaseOrderForm',
	'SalesOrderForm',
	'ShipmentForm',
	'PackageForm',
	'StorageForm',
	'ContainerForm',
	'CategoryForm',
	'QuotationMetaCard',
	'QuotationPriceCard',
	'QuotationDetailBody',
	'QuotationReadonlyInfoCards',
	'QuotationEditHeader',
	'QuotationLinesTable',
	'AttributeManager',
	'AddressInfo',
	'ItemVariantManager',
	'ItemQuotationsTab',
	'ItemExternalLinksTab',
	'ItemComponentManager',
	'EditButton',
	'DualSelectionPanel',
	'CustomerAddressManager',
	'BulkEditTable',
	'BulkCategoryChangeModal',
	'TrackingLegForm',
	'PrintLabelButton',
	'OrderPaymentRecords',
	'OrderForm',
	'VariantAttributeBadge',
	'TrackingLegTimeline',
	'VariantCreator',
	'VariantQuotationManager'
];

const allowedRelativeImportDirs = [
	'lib/components/feedback/',
	'lib/components/status/',
	'lib/components/modal/',
	'lib/components/navigation/',
	'lib/components/forms/',
	'lib/components/quotation/',
	'lib/components/customer/',
	'lib/components/item/',
	'lib/components/order/',
	'lib/components/shipment/',
	'lib/components/ui/'
];

const namesAlternation = enforcedComponents.map(escapeRegex).join('|');
const forbiddenAbsolutePattern = new RegExp(`from ['"]\\$lib/components/(?:${namesAlternation})\\.svelte['"]`);
const forbiddenRelativePattern = new RegExp(`from ['"]\\./(?:${namesAlternation})\\.svelte['"]`);
const requiredBarrelPattern = /from ['"]\$lib\/components['"]/;

const files = collectSourceFiles(srcRoot);
const errors = [];

for (const abs of files) {
	const rel = toRelative(abs);
	const text = readFileSync(abs, 'utf8');

	if (forbiddenAbsolutePattern.test(text)) {
		errors.push(`[FORBIDDEN] ${rel} still imports old component path`);
	}

	if (
		!allowedRelativeImportDirs.some((prefix) => rel.startsWith(prefix)) &&
		forbiddenRelativePattern.test(text)
	) {
		errors.push(`[FORBIDDEN] ${rel} still imports old component path`);
	}

	const usedComponents = enforcedComponents.filter((name) =>
		new RegExp(`import\\s+[^;\\n]*\\b${escapeRegex(name)}\\b[^;\\n]*from\\s+['"]\\$lib/components`).test(text)
	);

	if (usedComponents.length === 0) {
		continue;
	}

	if (!requiredBarrelPattern.test(text)) {
		errors.push(`[ENTRY] ${rel} uses shared components but not from $lib/components`);
	}

	const namedImportMatches = [...text.matchAll(/import\s+\{([^}]*)\}\s+from\s+['"][^'"]+['"]/g)].map((m) => m[1]);
	for (const name of usedComponents) {
		const hasNamed = namedImportMatches.some((m) => new RegExp(`\\b${escapeRegex(name)}\\b`).test(m));
		if (!hasNamed) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for ${name}`);
		}
	}
}

if (errors.length > 0) {
	console.error('Shared component import policy violations:');
	for (const err of errors) {
		console.error(`- ${err}`);
	}
	process.exit(1);
}

console.log('Shared component import policy check passed.');
