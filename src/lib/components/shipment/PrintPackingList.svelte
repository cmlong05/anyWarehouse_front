<script lang="ts">
    import type { Package, PackageItem } from '$lib/shipmentTypes';
    import { formatDate } from '$lib/utils';

    export let pkg: Package | null = null;
</script>

<style>
    .print-only { display: none; }

    @media print {
        @page { size: 10cm 15cm; margin: 0.5cm; }
        :global(html), :global(body) { width: 10cm; height: 15cm; margin: 0; padding: 0; }
        :global(body) { background: white; }
        :global(.no-print) { display: none !important; }
        .print-only { display: block !important; }
        .print-area { width: 100%; font-size: 10px; line-height: 1.2; }
        .print-area table { border-collapse: collapse; width: 100%; }
        .print-area th, .print-area td { border: 1px solid #333; padding: 3px 4px; }
        .print-area th { background: #f3f4f6; }
    }
</style>

<div class="print-only print-area p-4 bg-white text-black" style="display:none;">
    {#if pkg}
        <div class="text-center mb-3">
            <h2 class="text-lg font-bold">装箱单</h2>
            <p class="text-sm mt-1">包裹编号：{pkg.package_no}</p>
            <p class="text-sm">创建时间：{formatDate(pkg.created_at)}</p>
        </div>
        <table class="w-full text-xs border-collapse">
            <thead>
                <tr>
                    <th class="border px-1 py-1 text-left">SKU</th>
                    <th class="border px-1 py-1 text-left">商品名称</th>
                    <th class="border px-1 py-1 text-left">存储位置</th>
                </tr>
            </thead>
            <tbody>
                {#each pkg.items ?? [] as item}
                    <tr>
                        <td class="border px-1 py-1">{item.sku}</td>
                        <td class="border px-1 py-1">{item.product_name}</td>
                        <td class="border px-1 py-1">{item.storage_locations?.join(', ') || '-'}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
