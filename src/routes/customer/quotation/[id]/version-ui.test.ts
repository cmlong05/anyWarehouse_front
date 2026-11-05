// @ts-expect-error Bun supplies Node built-ins at test runtime without app type declarations.
import { readFileSync } from 'node:fs';
// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { parse } from 'svelte/compiler';

interface AstNode {
	type?: string;
	name?: string;
	attributes?: AstNode[];
	value?: AstNode[];
	data?: string;
	[key: string]: unknown;
}

function findComponents(node: AstNode, name: string, matches: AstNode[] = []): AstNode[] {
	if (node.type === 'Component' && node.name === name) matches.push(node);

	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const child of value) {
				if (child && typeof child === 'object') {
					findComponents(child as AstNode, name, matches);
				}
			}
		} else if (value && typeof value === 'object') {
			findComponents(value as AstNode, name, matches);
		}
	}

	return matches;
}

function findText(node: AstNode, text: string): boolean {
	if (node.type === 'Text' && node.data?.includes(text)) return true;

	return Object.values(node).some((value) => {
		if (Array.isArray(value)) {
			return value.some((child) =>
				child && typeof child === 'object' ? findText(child as AstNode, text) : false
			);
		}
		return value && typeof value === 'object'
			? findText(value as AstNode, text)
			: false;
	});
}

describe('customer quotation version UI', () => {
	test('renders price version actions and history', () => {
		const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
		const ast = parse(source, { modern: true }) as unknown as AstNode;
		const modal = findComponents(ast.fragment as AstNode, 'AdjustPriceModal')[0];

		expect(modal).toBeDefined();
		expect(modal?.attributes?.some((attribute) => attribute.name === 'createVersion')).toBe(true);
		expect(findComponents(ast.fragment as AstNode, 'VersionHistoryCard')).toHaveLength(1);
		expect(findComponents(ast.fragment as AstNode, 'EditButton')).toHaveLength(1);
	});

	test('shows current price as read-only on the edit page', () => {
		const source = readFileSync(new URL('./edit/+page.svelte', import.meta.url), 'utf8');
		const ast = parse(source, { modern: true }) as unknown as AstNode;

		expect(findText(ast.fragment as AstNode, '当前价格')).toBe(true);
	});
});
