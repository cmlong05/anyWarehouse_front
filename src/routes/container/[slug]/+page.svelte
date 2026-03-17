<script lang="ts">
    import type { ContainerResponse } from '$lib';
    import { formatNumber } from '$lib/utils';
    import { goto } from '$app/navigation';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { DataTable } from '$lib/components/ui';
    import ChevronRight from 'lucide-svelte/icons/chevron-right';
    import Package from 'lucide-svelte/icons/package';
    import BoxIcon from 'lucide-svelte/icons/box';
    import Edit from 'lucide-svelte/icons/edit';
    import Plus from 'lucide-svelte/icons/plus';
    
    interface Props {
        data: {
            containerRes: ContainerResponse;
        };
    }
    
    let { data }: Props = $props();
    
    const container = $derived(data.containerRes.container);
    const descendants = $derived(data.containerRes.descendants);
    const storages = $derived(data.containerRes.storages);
    const ancestors = $derived(data.containerRes.ancestors);
    const siblings = $derived(data.containerRes.siblings);
    
    // 控制子容器显示（默认隐藏空子容器）
    let showDescendants = $state(false);
    
    // 统计
    const usagePercent = $derived(container.volume > 0 ? Math.round((container.a_volume / container.volume) * 100) : 0);
    const descendantCount = $derived(descendants.length);
    const storageCount = $derived(storages.length);
    
    // 表格列定义
    const descendantColumns = [
        { key: 'fastCode', title: '容器编码', width: '120px' },
        { key: 'mark', title: '描述' },
        { key: 'usage', title: '容量占用', width: '150px', align: 'center' as const },
    ];
    
    const storageColumns = [
        { key: 'quantity', title: '数量', width: '100px', align: 'right' as const },
        { key: 'sku', title: 'SKU', width: '120px' },
        { key: 'name', title: '品项名称' },
    ];
    
    function goToEdit() {
        goto(`/container/${container.fastCode}/edit`);
    }
    
    function goToAddChild() {
        goto(`/container/add?parent=${container.fastCode}`);
    }
    
    function goToItem(itemId: number) {
        goto(`/item/${itemId}`);
    }
</script>

<svelte:head>
    <title>{container.fastCode} - 容器管理</title>
</svelte:head>

<PageContainer>
    <PageHeader title="容器详情">
        {#snippet actions()}
            <button 
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                onclick={goToEdit}
            >
                <Edit class="h-4 w-4" />
                <span>编辑</span>
            </button>
            <button 
                class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                onclick={goToAddChild}
            >
                <Plus class="h-4 w-4" />
                <span>添加子容器</span>
            </button>
        {/snippet}
    </PageHeader>
    
    <!-- 面包屑导航 -->
    <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm text-gray-600">导航:</span>
            {#each ancestors as ancestor (ancestor.fastCode)}
                <div class="flex items-center gap-2">
                    <a href="/container/{ancestor.fastCode}" class="text-blue-600 hover:text-blue-800 text-sm">
                        {ancestor.fastCode}
                    </a>
                    <ChevronRight class="h-4 w-4 text-gray-400" />
                </div>
            {/each}
            <span class="text-sm font-semibold text-gray-900">{container.fastCode}</span>
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 主内容区 (70%) -->
        <div class="lg:col-span-2 space-y-6">
            <!-- 容量卡片 -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
                    <BoxIcon class="h-5 w-5 text-blue-600" />
                    {container.fastCode}
                </h2>
                <!-- 分隔线 -->
                <div class="border-t border-gray-200"></div>
                    
                <div class="space-y-6">
                    <!-- 容器信息卡片 -->
                    <div class="flex justify-between mb-2">
                        <p class="text-sm text-gray-600 mb-4">{container.mark || '-'}</p>
                    </div>
                    <!-- 进度条 -->
                    <div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-gray-600">当前占用</span>
                            <span class="font-semibold text-gray-900">
                                {formatNumber(container.a_volume)} / {formatNumber(container.volume)}
                            </span>
                        </div>
                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                class="h-full bg-blue-600 transition-all"
                                style="width: {usagePercent}%"
                            ></div>
                        </div>
                        <div class="text-right mt-2 text-sm text-gray-600">
                            {usagePercent}% 已占用
                        </div>
                    </div>
                    
                    <!-- 详细参数 -->
                    <div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">总容量</span>
                                <span class="text-gray-900 font-mono">{formatNumber(container.volume)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">已占用</span>
                                <span class="text-gray-900 font-mono">{formatNumber(container.a_volume)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">可用</span>
                                <span class="text-gray-900 font-mono">{formatNumber(container.volume - container.a_volume)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 子容器卡片 -->
            {#if descendants.length > 0}
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div class="flex items-center gap-2">
                            <Package class="h-5 w-5 text-blue-600" />
                            <span>子容器 ({descendantCount})</span>
                        </div>
                    </h2>
                    <DataTable
                        data={descendants.map(d => ({
                            ...d,
                            usage: `${formatNumber(d.available_volume)} / ${formatNumber(d.base_volume)}`
                        }))}
                        columns={descendantColumns}
                        clickable={true}
                        onRowClick={(row: any) => goto(`/container/${row.fastCode}`)}
                    >
                        {#snippet cellRender({ item, column })}
                            {#if column.key === 'fastCode'}
                                <a href="/container/{item.fastCode}" class="text-blue-600 hover:text-blue-800 font-medium">
                                    {item.fastCode}
                                </a>
                            {:else if column.key === 'usage'}
                                <div class="text-sm">
                                    <div class="flex items-center gap-2">
                                        <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                class="h-full bg-green-500"
                                                style="width: {item.base_volume > 0 ? Math.round((item.available_volume / item.base_volume) * 100) : 0}%"
                                            ></div>
                                        </div>
                                        <span class="text-gray-600">{item.usage}</span>
                                    </div>
                                </div>
                            {:else}
                                {item[column.key as keyof typeof item]}
                            {/if}
                        {/snippet}
                    </DataTable>
                </div>
            {/if}
            
            <!-- 存储信息卡片 -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BoxIcon class="h-5 w-5 text-blue-600" />
                    存储信息 ({storageCount})
                </h2>
                {#if storages.length === 0}
                    <div class="py-8 text-center text-gray-500">
                        <p>暂无存储物品</p>
                    </div>
                {:else}
                    <DataTable
                        data={storages.map(s => ({
                            ...s,
                            quantity: formatNumber(s.quantity),
                            sku: s.item_SKU,
                            name: s.item_name
                        }))}
                        columns={storageColumns}
                        clickable={true}
                        onRowClick={(row: any) => goToItem(row.item_id)}
                    >
                        {#snippet cellRender({ item, column })}
                            {#if column.key === 'sku'}
                                <a href="/item/{item.item_id}" class="text-blue-600 hover:text-blue-800 font-mono text-sm">
                                    {item.sku}
                                </a>
                            {:else if column.key === 'quantity'}
                                <span class="font-semibold text-gray-900">{item.quantity}</span>
                            {:else}
                                {item[column.key as keyof typeof item]}
                            {/if}
                        {/snippet}
                    </DataTable>
                {/if}
            </div>
        </div>
        
        <!-- 侧栏区 (30%) -->
        <div class="lg:col-span-1">
            <div class="sticky top-4 space-y-4">                            
                <!-- 相邻容器 -->
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 class="text-mdfont-semibold text-gray-700 mb-3">相邻容器</h3>
                    <div class="space-y-1">
                        {#each siblings as sibling}
                            <div>
                                {#if sibling.fastCode === container.fastCode}
                                    <span class="text-md bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                                        {sibling.fastCode}
                                    </span>
                                {:else}
                                    <a 
                                        href="/container/{sibling.fastCode}"
                                        class="block text-md text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                                    >
                                        {sibling.fastCode}
                                    </a>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</PageContainer>
