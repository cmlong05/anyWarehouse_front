<!-- 包裹状态徽标 -->
<script lang="ts">
    export let status: string;

    const statusMap: Record<string, { label: string; classes: string }> = {
        pending: { label: '待装箱', classes: 'badge-warning' },
        sealed: { label: '已封箱', classes: 'badge-success' },
    };

    const config = statusMap[status] || { label: status, classes: 'badge' };
</script>

<span class="badge {config.classes}">
    {config.label}
</span>
