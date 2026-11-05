# 全局居中弹窗改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace all 55 native browser alert/confirm calls with one queued, centered dialog system while preserving operation order.

**Architecture:** A framework-independent queue manager owns Promise resolution and FIFO ordering. A Svelte adapter exposes reactive state, and a single `DialogHost` mounted in the root layout renders generic alerts and confirmations. Existing specialized business modals remain unchanged.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, TailwindCSS 4, Bun test

**Spec:** `docs/superpowers/specs/2026-11-05-global-dialogs-design.md`

## Global Constraints

- Do not change backend APIs, business rules, route behavior, or domain models.
- Existing specialized centered modals must remain functionally unchanged.
- Business code must stop using native `alert()`, `confirm()`, and `prompt()`.
- Confirmation flows must await the dialog result before continuing.
- Generic dialogs must be centered, queued, keyboard dismissible, and accessible.

---

### Task 1: Dialog Queue Manager

**Files:**
- Create: `src/lib/dialog/manager.ts`
- Test: `src/lib/dialog/manager.test.ts`

**Interfaces:**
- Produces: `new DialogManager(onChange)`
- Produces: `manager.alert(message, options): Promise<void>`
- Produces: `manager.confirm(message, options): Promise<boolean>`
- Produces: `manager.resolve(confirmed: boolean): void`
- Produces: `manager.current: DialogRequest | null`

- [x] **Step 1: Write queue tests**

```ts
import { describe, expect, test } from 'bun:test';
import { DialogManager } from './manager';

test('confirm resolves with the user choice', async () => {
	const manager = new DialogManager(() => {});
	const result = manager.confirm('Delete?');
	manager.resolve(true);
	expect(await result).toBe(true);
});

test('dialogs are shown one at a time in FIFO order', async () => {
	const manager = new DialogManager(() => {});
	const first = manager.alert('first');
	const second = manager.confirm('second');
	expect(manager.current?.message).toBe('first');
	manager.resolve(false);
	expect(manager.current?.message).toBe('second');
	manager.resolve(false);
	await Promise.all([first, second]);
});
```

- [x] **Step 2: Run the test and observe missing module failure**

Run: `nix-shell --run "bun test src/lib/dialog/manager.test.ts"`

Expected: FAIL because `manager.ts` does not exist.

- [x] **Step 3: Implement the manager**

Implement request normalization, defaults, queueing, active-state notification, Promise resolution, and safe ignore behavior when no request is active.

- [x] **Step 4: Run the manager tests**

Run: `nix-shell --run "bun test src/lib/dialog/manager.test.ts"`

Expected: PASS.

### Task 2: Global Dialog UI

**Files:**
- Create: `src/lib/stores/dialog.svelte.ts`
- Create: `src/lib/components/modal/DialogHost.svelte`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/components/modal/index.ts`

**Interfaces:**
- Consumes: `DialogManager`
- Produces: `showAlert(message, options): Promise<void>`
- Produces: `showConfirm(message, options): Promise<boolean>`
- Produces: `dialogState.current`

- [x] **Step 1: Create the Svelte adapter**

Instantiate one module-level manager and expose reactive current state plus `showAlert`, `showConfirm`, and `resolveDialog`.

- [x] **Step 2: Create `DialogHost`**

Render one centered overlay with `role="dialog"` and `aria-modal="true"`. Support info/success/warning/error/danger variants, multiline messages, one-button alerts, two-button confirmations, Escape, backdrop click, body scroll locking, and initial focus.

- [x] **Step 3: Mount `DialogHost` once in the root layout**

Import and render it outside the login/main layout branch so every route uses the same host.

- [x] **Step 4: Run type checking**

Run: `nix-shell --run "bun run check"`

Expected: 0 errors, 0 warnings.

### Task 3: Customer and Supplier Flows

**Files:**
- Modify: `src/routes/customer/sales-order/[id]/+page.svelte`
- Modify: `src/routes/customer/shipment/[id]/+page.svelte`
- Modify: `src/routes/customer/package/[id]/+page.svelte`
- Modify: `src/routes/customer/quotation/[id]/+page.svelte`
- Modify: `src/routes/supplier/quotation/[id]/+page.svelte`
- Modify: `src/routes/supplier/purchase-order/[id]/+page.svelte`
- Modify: `src/lib/composables/useOrderDetail.svelte.ts`
- Modify: `src/lib/composables/useOrderList.svelte.ts`

- [x] **Step 1: Replace order and shipment alerts/confirms**

Use `await showConfirm(...)` before destructive/status actions. Use `await showAlert(...)` for success/error notices where sequence matters and `void showAlert(...)` only for terminal error notifications.

- [x] **Step 2: Replace package and quotation alerts/confirms**

Preserve multiline quotation details with `whitespace-pre-line` dialog rendering.

- [x] **Step 3: Run targeted scans**

Run:

```bash
rg --pcre2 '(?<![.\w])(?:window\.)?(?:alert|confirm|prompt)\s*\(' \
  src/routes/customer/sales-order src/routes/customer/shipment \
  src/routes/customer/package src/routes/customer/quotation \
  src/routes/supplier src/lib/composables/useOrderDetail.svelte.ts \
  src/lib/composables/useOrderList.svelte.ts
```

Expected: no rows.

### Task 4: Item and Form Flows

**Files:**
- Modify: `src/routes/item/+page.svelte`
- Modify: `src/routes/item/category/[slug]/edit/+page.svelte`
- Modify: `src/lib/components/forms/ItemForm.svelte`
- Modify: `src/lib/components/forms/CategoryForm.svelte`
- Modify: `src/lib/components/forms/StorageForm.svelte`
- Modify: `src/lib/components/forms/ContainerForm.svelte`
- Modify: `src/lib/components/item/AttributeManager.svelte`
- Modify: `src/lib/components/item/ItemAssociationsTab.svelte`
- Modify: `src/lib/components/item/ItemComponentManager.svelte`
- Modify: `src/lib/components/item/ItemExternalLinksTab.svelte`
- Modify: `src/lib/components/customer/CustomerAddressManager.svelte`

- [x] **Step 1: Replace item list and form alerts**

Validation and success alerts use `warning` or `success`; submit failures use `error`. Make synchronous handlers async when they must wait for dismissal.

- [x] **Step 2: Replace destructive confirmations**

Use `showConfirm` with the danger variant for attributes, categories, components, storage, container, address, and association removal.

- [x] **Step 3: Run targeted scans**

Run the native-dialog scan against the files in this task.

Expected: no rows.

### Task 5: Warehouse, Inventory, and Printing

**Files:**
- Modify: `src/lib/composables/useInventoryCheck.svelte.ts`
- Modify: `src/lib/composables/useOutboundFlow.svelte.ts`
- Modify: `src/lib/utils/printLabel.ts`

- [x] **Step 1: Replace inventory and outbound alerts**

Use awaited error dialogs in async flows; preserve `processing` and status-clear behavior.

- [x] **Step 2: Replace print-window alert**

Await the error dialog before returning `false` from `printLabel`.

- [x] **Step 3: Run targeted scans**

Run the native-dialog scan against the files in this task.

Expected: no rows.

### Task 6: Full Verification

**Files:**
- Verify all changed frontend files.
- Scan all `.svelte`, `.ts`, and `.js` files under `src`.

- [x] **Step 1: Scan the complete frontend**

Run:

```bash
rg --pcre2 -n --glob '*.{svelte,ts,js}' \
  '(?<![.\w])(?:window\.)?(?:alert|confirm|prompt)\s*\(' src
```

Expected: no native dialog calls. Local functions and API methods named `confirm` are outside this call pattern.

- [x] **Step 2: Run unit tests**

Run: `nix-shell --run "bun test"`

Expected: all tests pass.

- [x] **Step 3: Run type checking**

Run: `nix-shell --run "bun run check"`

Expected: 0 errors, 0 warnings.

- [x] **Step 4: Run production build**

Run: `nix-shell --run "bun run build"`

Expected: exit code 0.
