# 已有居中弹窗统一重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Move all 28 existing centered overlays onto one `BaseModal` interaction and visual contract without changing their business state or form behavior.

**Architecture:** A shared modal shell owns overlay, dimensions, responsive layout, scroll locking, focus management, keyboard handling, and close reasons. Existing modal components retain their own props, local state, validation, dirty-form checks, and async operations, replacing only their overlay and shell markup.

**Tech Stack:** SvelteKit 2, Svelte 5 runes/snippets, TypeScript, TailwindCSS 4, Bun test

**Spec:** `docs/superpowers/specs/2026-11-05-unify-centered-modals-design.md`

## Global Constraints

- Do not change APIs, form fields, data loading, or mutation behavior.
- Preserve each modal's existing loading and dirty-form close protection.
- Only the topmost nested modal may respond to Escape.
- Every final modal surface must use `BaseModal`.
- The global `DialogHost` remains the canonical generic alert/confirm renderer.
- Run `bun test`, `bun run check`, and `bun run build` before completion.

---

### Task 1: Modal Stack and Interaction Utility

**Files:**
- Create: `src/lib/modal/stack.ts`
- Create: `src/lib/modal/stack.test.ts`
- Create: `src/lib/composables/useModalInteraction.svelte.ts`

**Interfaces:**
- Produces: `pushModal(close): () => void`
- Produces: `isTopModal(close): boolean`
- Produces: `useModalInteraction(options): { modalElement, dialogId }`
- Consumes: DOM focusable elements and global body scroll state

- [x] **Step 1: Write failing stack tests**

```ts
import { describe, expect, test } from 'bun:test';
import { createModalStack } from './stack';

describe('createModalStack', () => {
	test('only the top modal is active', () => {
		const stack = createModalStack();
		const first = stack.push(() => {});
		const second = stack.push(() => {});

		expect(stack.isTop(first)).toBe(false);
		expect(stack.isTop(second)).toBe(true);

		second();
		expect(stack.isTop(first)).toBe(true);
	});

	test('body remains locked until the last modal closes', () => {
		const stack = createModalStack();
		const first = stack.push(() => {});
		const second = stack.push(() => {});

		expect(stack.lockCount).toBe(2);
		second();
		expect(stack.lockCount).toBe(1);
		first();
		expect(stack.lockCount).toBe(0);
	});
});
```

- [x] **Step 2: Run the tests and observe missing module failure**

Run: `nix-shell --run "bun test src/lib/modal/stack.test.ts"`

Expected: FAIL because `stack.ts` does not exist.

- [x] **Step 3: Implement stack state**

Provide a factory for isolated tests and one application-level instance. Closing must be idempotent and only remove the exact token.

- [x] **Step 4: Implement modal interaction composable**

Manage body scroll lock, prior focus, initial focus, Tab/Shift+Tab cycling, Escape for the top modal, and focus restoration.

- [x] **Step 5: Run tests and type checking**

Run:

```bash
nix-shell --run "bun test src/lib/modal/stack.test.ts"
nix-shell --run "bun run check"
```

Expected: PASS.

### Task 2: BaseModal Shell

**Files:**
- Create: `src/lib/components/modal/BaseModal.svelte`
- Modify: `src/lib/components/modal/index.ts`

**Interfaces:**
- Consumes: `useModalInteraction`
- Produces: shared `open`, `title`, `description`, `size`, `busy`, `closeOnBackdrop`, `closeOnEscape`, `canDismiss`, and `onClose` contract
- Produces snippets: `default`, optional `header`, optional `footer`

- [x] **Step 1: Implement the shell**

Use one fixed overlay and one centered panel. Standardize `bg-black/50`, `p-4`, rounded corners, shadow, `max-height: 90vh`, internal scrolling, header, body, footer, and accessible title IDs.

- [x] **Step 2: Implement close reasons**

Emit `close-button`, `backdrop`, or `escape`. Route all reasons through `canDismiss` and `busy` before closing.

- [x] **Step 3: Implement sizes**

Provide `sm/md/lg/xl/full` through static Tailwind class maps only.

- [x] **Step 4: Verify**

Run: `nix-shell --run "bun run check"`

Expected: 0 errors, 0 warnings.

### Task 3: Generic Dialogs

**Files:**
- Modify: `src/lib/components/modal/ConfirmModal.svelte`
- Modify: `src/lib/components/modal/ErrorModal.svelte`
- Modify: `src/lib/components/shipment/DeleteConfirmModal.svelte`
- Modify: `src/lib/components/modal/DialogHost.svelte`

**Interfaces:**
- Keep existing public props for legacy callers.
- `DialogHost` keeps using the global queue and only delegates rendering to `BaseModal`.

- [x] **Step 1: Refactor `ConfirmModal`**

Preserve all current props and callers. Move overlay, header, actions, and focus behavior into `BaseModal`.

- [x] **Step 2: Refactor `ErrorModal`**

Preserve `message` and `onClose`; use `BaseModal` with a single action.

- [x] **Step 3: Refactor `DeleteConfirmModal`**

Preserve Y/N shortcuts, but route Escape through `BaseModal` and keep keyboard listeners on the window only while open.

- [x] **Step 4: Refactor `DialogHost`**

Keep queue state in `dialog.svelte.ts`; replace its duplicated overlay markup with `BaseModal`.

- [x] **Step 5: Verify generic dialogs**

Run:

```bash
nix-shell --run "bun test"
nix-shell --run "bun run check"
```

### Task 4: Item Modal Family

**Files:**
- Modify: `src/lib/components/item/AssemblyModal.svelte`
- Modify: `src/lib/components/item/DisassemblyModal.svelte`
- Modify: `src/lib/components/item/OutboundConfirmModal.svelte`
- Modify: `src/lib/components/item/TransferConfirmModal.svelte`
- Modify: `src/lib/components/item/BulkCategoryChangeModal.svelte`
- Modify: `src/lib/components/item/ItemVariantManager.svelte`
- Modify: `src/lib/components/item/ItemExternalLinksTab.svelte`

**Interfaces:**
- Consumes: `BaseModal`
- Preserves: each component's current local modal flags, dirty checks, submit handlers, and loading behavior

- [x] **Step 1: Refactor simple confirmation modals**

Move Outbound and Transfer confirmation overlays to `BaseModal`; keep quantity and allocation state untouched.

- [x] **Step 2: Refactor item operation forms**

Move Assembly and Disassembly to `BaseModal`, preserving dirty-state close prevention and existing action buttons.

- [x] **Step 3: Refactor management overlays**

Move BulkCategory, ItemVariant, and ExternalLink add overlays. Use `xl` for tabular content and `lg` for forms.

- [x] **Step 4: Verify item overlays**

Run the fixed overlay scan for the files in this task. Each remaining `fixed inset-0` must come from `BaseModal` exclusively.

### Task 5: Order, Shipment, and Quotation Modal Family

**Files:**
- Modify: `src/lib/components/order/OrderSyncOptionsModal.svelte`
- Modify: `src/lib/components/order/OrderSyncResultModal.svelte`
- Modify: `src/lib/components/order/ShipReceiveModal.svelte`
- Modify: `src/lib/components/shipment/ShipmentSyncOptionsModal.svelte`
- Modify: `src/lib/components/shipment/ShipmentSyncResultModal.svelte`
- Modify: `src/lib/components/shipment/LinkPackageModal.svelte`
- Modify: `src/lib/components/shipment/TrackingNumberDetailModal.svelte`
- Modify: `src/lib/components/quotation/AdjustPriceModal.svelte`

**Interfaces:**
- Consumes: `BaseModal`
- Preserves: sync options, result item lists, receiving quantities, package selection, tracking timelines, and price adjustment state

- [x] **Step 1: Refactor order modals**

Use `md` for option/result modals and `lg` for `ShipReceiveModal`. Preserve confirmation handlers and loading states.

- [x] **Step 2: Refactor shipment modals**

Use `md` for sync options/results and `lg` or `xl` for package/tracking detail based on content width.

- [x] **Step 3: Refactor quotation modal**

Preserve adjusted price state and close behavior while moving the shell to `BaseModal`.

- [x] **Step 4: Verify this family**

Run:

```bash
rg -n 'fixed inset-0' src/lib/components/order src/lib/components/shipment src/lib/components/quotation
```

Expected: matching lines exist only inside `BaseModal` implementations, not in the migrated business modals.

### Task 6: Inline Centered Overlays

**Files:**
- Modify: `src/lib/components/customer/CustomerAddressManager.svelte`
- Modify: `src/lib/components/forms/PackageForm.svelte`
- Modify: `src/lib/components/ui/BulkEditTable.svelte`
- Modify: `src/routes/customer/package/+page.svelte`
- Modify: `src/routes/customer/package/[id]/+page.svelte`
- Modify: `src/routes/customer/shipment/+page.svelte`
- Modify: `src/routes/customer/shipment/tracking-number/+page.svelte`
- Modify: `src/lib/components/item/ItemExternalLinksTab.svelte`
- Modify: `src/lib/components/item/ItemVariantManager.svelte`

**Interfaces:**
- Consumes: `BaseModal`
- Preserves: all local visibility flags, selected records, form state, and page-specific close guards

- [x] **Step 1: Replace form/detail overlays**

Convert customer address, tracking form/detail, external links, variant management, and bulk edit overlays.

- [x] **Step 2: Replace result/selection overlays**

Convert package allocation errors, package deletion/leg operations, shipment selection, and detail overlays.

- [x] **Step 3: Verify no duplicate shell logic**

Run:

```bash
rg -n 'fixed inset-0' src -g '*.svelte'
```

Expected: results only in `BaseModal` and intentionally non-modal overlays such as the global navigation dropdown.

### Task 7: Final Interaction and Visual Verification

**Files:**
- Verify all files from Tasks 1-6.

- [ ] **Step 1: Verify focus and keyboard behavior**

For every modal family, check:

- Escape closes only the top modal.
- `busy` blocks Escape/backdrop/header close.
- Tab and Shift+Tab remain inside the active modal.
- Closing restores focus to the trigger.

- [ ] **Step 2: Verify responsive layout**

At phone and desktop widths, check safe margins, maximum height, internal scrolling, sticky or visible actions, and long text wrapping.

- [x] **Step 3: Run automated verification**

Run:

```bash
nix-shell --run "bun test"
nix-shell --run "bun run check"
nix-shell --run "bun run build"
```

Expected: all tests pass, 0 diagnostics, build exit code 0.
