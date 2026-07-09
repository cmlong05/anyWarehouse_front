<!-- 核查底部工具栏 — 全部勾选/取消按钮 -->
<!--
被依赖：checklist/+page.svelte
-->
<script lang="ts">
    import type { ChecklistSummary } from '$lib/shipmentTypes';

    let { summary, oncheckall = () => {}, onuncheckall = () => {} }: {
        summary: ChecklistSummary;
        oncheckall?: () => void;
        onuncheckall?: () => void;
    } = $props();

    let allChecked = $derived(summary.total > 0 && summary.checked === summary.total);
</script>

<div class="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-white">
    <button
        class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
        onclick={() => allChecked ? onuncheckall() : oncheckall()}
    >
        {allChecked ? '全部取消' : '全部勾选'}
    </button>
</div>
