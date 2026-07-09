<!-- 核查进度条 — 已核查/总数 + 差异数 + 彩色进度条 -->
<!--
被依赖：checklist/+page.svelte
-->
<script lang="ts">
    import type { ChecklistSummary } from '$lib/shipmentTypes';

    let { summary }: { summary: ChecklistSummary } = $props();

    let percent = $derived(
        summary.total > 0 ? Math.round((summary.checked / summary.total) * 100) : 0
    );
</script>

<div class="px-4 py-3">
    <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-gray-700">
            已核查 {summary.checked}/{summary.total}
        </span>
        {#if summary.discrepancy_count > 0}
            <span class="text-orange-500 font-medium">差异 {summary.discrepancy_count} 项</span>
        {:else if summary.total > 0}
            <span class="text-green-600 font-medium">无差异</span>
        {/if}
    </div>
    <div class="mt-1.5 h-2 w-full rounded-full bg-gray-200">
        <!-- Tailwind can't express runtime percentage-based width -->
        <div
            class="h-2 rounded-full transition-all duration-300 {summary.discrepancy_count > 0 ? 'bg-orange-400' : 'bg-green-500'}"
            style="width: {percent}%"
        ></div>
    </div>
</div>
