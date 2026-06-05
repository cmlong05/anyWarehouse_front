<!-- 发货单状态徽标 -->
<!--
被依赖：
- `routes/customer/package/[id]/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/customer/shipment/[id]/+page.svelte`
-->
<script lang="ts">
    export let status: string;

    const statusMap: Record<string, { label: string; classes: string }> = {
        draft: { label: '草稿', classes: 'bg-gray-100 text-gray-600' },
        synced: { label: '已同步', classes: 'bg-purple-100 text-purple-700' },
        confirmed: { label: '已确认', classes: 'bg-blue-100 text-blue-700' },
        packed: { label: '已打包', classes: 'bg-yellow-100 text-yellow-700' },
        shipped: { label: '已发货', classes: 'bg-green-100 text-green-700' },
        delivered: { label: '已签收', classes: 'bg-indigo-100 text-indigo-700' },
        cancelled: { label: '已取消', classes: 'bg-red-100 text-red-700' },
    };

    const config = statusMap[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {config.classes}">
    {config.label}
</span>