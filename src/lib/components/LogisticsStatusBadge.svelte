<script lang="ts">
    export let status: string;

    const statusMap: Record<string, { label: string; classes: string }> = {
        pending: { label: '待揽收', classes: 'bg-gray-100 text-gray-600' },
        collected: { label: '已揽收', classes: 'bg-blue-100 text-blue-700' },
        in_transit: { label: '运输中', classes: 'bg-indigo-100 text-indigo-700' },
        exception: { label: '异常', classes: 'bg-yellow-100 text-yellow-700' },
        delivered: { label: '已签收', classes: 'bg-green-100 text-green-700' },
        returned: { label: '已退回', classes: 'bg-orange-100 text-orange-700' },
        cancelled: { label: '已作废', classes: 'bg-red-100 text-red-600' },
    };

    const config = statusMap[status] || { label: status, classes: 'bg-gray-100 text-gray-500' };
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {config.classes}">
    {config.label}
</span>
