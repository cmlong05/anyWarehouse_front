<script lang="ts">
    import Printer from 'lucide-svelte/icons/printer';
    import { printLabel, DEFAULT_LABEL_SIZES, type LabelSize } from '$lib/utils/printLabel';

    interface Props {
        /** 主显示码（大字） */
        code: string;
        /** 条形码值（CODE128） */
        barcode: string | null;
        /** 浏览器标签页标题，默认 `${code} - 标签` */
        title?: string;
        /** 自定义可选尺寸 */
        sizes?: LabelSize[];
        /** 默认勾选项 ID */
        defaultSizeId?: string;
        /** 按钮文案 */
        label?: string;
    }

    let {
        code,
        barcode,
        title,
        sizes = DEFAULT_LABEL_SIZES,
        defaultSizeId = '100x100',
        label = '打印标签'
    }: Props = $props();

    let menuOpen = $state(false);
    let menuRef = $state<HTMLDivElement | null>(null);
    let customW = $state<number | null>(null);
    let customH = $state<number | null>(null);
    let customError = $state('');

    function toggle() {
        menuOpen = !menuOpen;
    }

    async function handleSelect(size: LabelSize) {
        menuOpen = false;
        if (!barcode) return;
        await printLabel({ code, barcode, size, title });
    }

    async function handleCustom() {
        customError = '';
        const w = Number(customW);
        const h = Number(customH);
        if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
            customError = '请输入有效的宽高（mm）';
            return;
        }
        if (w > 300 || h > 300 || w < 10 || h < 5) {
            customError = '尺寸需在 10–300mm（高 ≥ 5mm）之间';
            return;
        }
        if (!barcode) return;
        menuOpen = false;
        await printLabel({ code, barcode, size: { width: w, height: h }, title });
    }

    function handleDocClick(e: MouseEvent) {
        if (!menuOpen) return;
        const target = e.target as Node | null;
        if (menuRef && target && menuRef.contains(target)) return;
        menuOpen = false;
    }
</script>

<svelte:window onclick={handleDocClick} />

<div class="relative" bind:this={menuRef}>
    <button
        type="button"
        onclick={toggle}
        class="inline-flex items-center justify-center p-2 rounded text-sm font-medium border bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        aria-label={label}
        title={label}
    >
        <Printer class="w-4 h-4" />
    </button>
    {#if menuOpen}
        <div
            class="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1"
            role="menu"
        >
            {#each sizes as size (size.id)}
                <button
                    type="button"
                    class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    onclick={() => handleSelect(size)}
                >
                    {size.label}{size.id === defaultSizeId ? '（默认）' : ''}
                </button>
            {/each}
            <div class="border-t border-gray-200 mt-1 pt-2 px-3 pb-2">
                <div class="text-xs text-gray-500 mb-1">自定义尺寸 (mm)</div>
                <div class="flex items-center gap-1">
                    <input
                        type="number"
                        min="10"
                        max="300"
                        step="1"
                        bind:value={customW}
                        placeholder="宽"
                        class="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <span class="text-gray-400 text-sm">×</span>
                    <input
                        type="number"
                        min="5"
                        max="300"
                        step="1"
                        bind:value={customH}
                        placeholder="高"
                        class="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onclick={handleCustom}
                        class="ml-auto px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        打印
                    </button>
                </div>
                {#if customError}
                    <div class="text-xs text-red-600 mt-1">{customError}</div>
                {/if}
            </div>
        </div>
    {/if}
</div>
