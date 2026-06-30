<script lang="ts">
    import type { QuotationVersion } from '$lib';

    interface Props {
        versions: QuotationVersion[];
        currentVersionId: number | null;
        loading: boolean;
    }

    let { versions, currentVersionId, loading }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">价格历史记录</h3>

    {#if loading}
        <p class="text-gray-500 text-sm">加载中...</p>
    {:else if versions.length === 0}
        <p class="text-gray-400 text-sm">暂无历史记录</p>
    {:else}
        <div class="overflow-hidden">
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-2 px-3 text-gray-500 font-medium">日期</th>
                        <th class="text-right py-2 px-3 text-gray-500 font-medium">价格</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium">备注</th>
                        <th class="text-center py-2 px-3 text-gray-500 font-medium">状态</th>
                    </tr>
                </thead>
                <tbody>
                    {#each versions as version}
                        <tr class="border-b border-gray-100" class:bg-blue-50={version.id === currentVersionId}>
                            <td class="py-2 px-3 text-gray-700">
                                {new Date(version.created_at).toLocaleDateString('zh-CN')}
                            </td>
                            <td class="py-2 px-3 text-right font-mono text-gray-900">
                                {Number(version.price).toFixed(2)}
                            </td>
                            <td class="py-2 px-3 text-gray-600">
                                {version.note || '-'}
                            </td>
                            <td class="py-2 px-3 text-center">
                                {#if version.id === currentVersionId}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        当前
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        历史
                                    </span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
