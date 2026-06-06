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

const files = collectSourceFiles(srcRoot);

const forbiddenAbsolutePatterns = [
	/from ['"]\$lib\/components\/Alert\.svelte['"]/,
	/from ['"]\$lib\/components\/Loading\.svelte['"]/,
	/from ['"]\$lib\/components\/LogisticsStatusBadge\.svelte['"]/,
	/from ['"]\$lib\/components\/PackageStatusBadge\.svelte['"]/,
	/from ['"]\$lib\/components\/ShipmentStatusBadge\.svelte['"]/,
	/from ['"]\$lib\/components\/ConfirmModal\.svelte['"]/,
	/from ['"]\$lib\/components\/Breadcrumb\.svelte['"]/
];
const forbiddenRelativePatterns = [
	/from ['"]\.\/Alert\.svelte['"]/,
	/from ['"]\.\/Loading\.svelte['"]/,
	/from ['"]\.\/LogisticsStatusBadge\.svelte['"]/,
	/from ['"]\.\/PackageStatusBadge\.svelte['"]/,
	/from ['"]\.\/ShipmentStatusBadge\.svelte['"]/,
	/from ['"]\.\/ConfirmModal\.svelte['"]/,
	/from ['"]\.\/Breadcrumb\.svelte['"]/
];

const requiredBarrelPattern = /from ['"]\$lib\/components['"]/;
const errors = [];

for (const abs of files) {
	const rel = toRelative(abs);
	const text = readFileSync(abs, 'utf8');

	if (forbiddenAbsolutePatterns.some((p) => p.test(text))) {
		errors.push(`[FORBIDDEN] ${rel} still imports old component path`);
	}
	if (
		!rel.startsWith('lib/components/feedback/') &&
		!rel.startsWith('lib/components/status/') &&
		!rel.startsWith('lib/components/modal/') &&
		!rel.startsWith('lib/components/navigation/') &&
		forbiddenRelativePatterns.some((p) => p.test(text))
	) {
		errors.push(`[FORBIDDEN] ${rel} still imports old component path`);
	}

	const importsAlert = /import\s+[^;\n]*\bAlert\b[^;\n]*from/.test(text);
	const importsLoading = /import\s+[^;\n]*\bLoading\b[^;\n]*from/.test(text);
	const importsLogisticsStatusBadge = /import\s+[^;\n]*\bLogisticsStatusBadge\b[^;\n]*from/.test(text);
	const importsPackageStatusBadge = /import\s+[^;\n]*\bPackageStatusBadge\b[^;\n]*from/.test(text);
	const importsShipmentStatusBadge = /import\s+[^;\n]*\bShipmentStatusBadge\b[^;\n]*from/.test(text);
	const importsConfirmModal = /import\s+[^;\n]*\bConfirmModal\b[^;\n]*from/.test(text);
	const importsBreadcrumb = /import\s+[^;\n]*\bBreadcrumb\b[^;\n]*from/.test(text);

	if (
		importsAlert ||
		importsLoading ||
		importsLogisticsStatusBadge ||
		importsPackageStatusBadge ||
		importsShipmentStatusBadge ||
		importsConfirmModal ||
		importsBreadcrumb
	) {
		if (!requiredBarrelPattern.test(text)) {
			errors.push(`[ENTRY] ${rel} uses shared components but not from $lib/components`);
		}

		const namedImportMatches = [...text.matchAll(/import\s+\{([^}]*)\}\s+from\s+['"][^'"]+['"]/g)].map((m) => m[1]);
		const hasNamedAlert = namedImportMatches.some((m) => /\bAlert\b/.test(m));
		const hasNamedLoading = namedImportMatches.some((m) => /\bLoading\b/.test(m));
		const hasNamedLogisticsStatusBadge = namedImportMatches.some((m) => /\bLogisticsStatusBadge\b/.test(m));
		const hasNamedPackageStatusBadge = namedImportMatches.some((m) => /\bPackageStatusBadge\b/.test(m));
		const hasNamedShipmentStatusBadge = namedImportMatches.some((m) => /\bShipmentStatusBadge\b/.test(m));
		const hasNamedConfirmModal = namedImportMatches.some((m) => /\bConfirmModal\b/.test(m));
		const hasNamedBreadcrumb = namedImportMatches.some((m) => /\bBreadcrumb\b/.test(m));

		if (importsAlert && !hasNamedAlert) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for Alert`);
		}
		if (importsLoading && !hasNamedLoading) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for Loading`);
		}
		if (importsLogisticsStatusBadge && !hasNamedLogisticsStatusBadge) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for LogisticsStatusBadge`);
		}
		if (importsPackageStatusBadge && !hasNamedPackageStatusBadge) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for PackageStatusBadge`);
		}
		if (importsShipmentStatusBadge && !hasNamedShipmentStatusBadge) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for ShipmentStatusBadge`);
		}
		if (importsConfirmModal && !hasNamedConfirmModal) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for ConfirmModal`);
		}
		if (importsBreadcrumb && !hasNamedBreadcrumb) {
			errors.push(`[IMPORT-FORM] ${rel} should use named import for Breadcrumb`);
		}
	}
}

if (errors.length > 0) {
	console.error('Feedback import policy violations:');
	for (const err of errors) {
		console.error(`- ${err}`);
	}
	process.exit(1);
}

console.log('Feedback import policy check passed.');
