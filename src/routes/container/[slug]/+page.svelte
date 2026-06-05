<!-- 容器详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import type { ContainerResponse } from '$lib';
    import { formatNumber } from '$lib/utils';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { DataTable } from '$lib/components/ui';
    import EditButton from '$lib/components/EditButton.svelte';
    import PrintLabelButton from '$lib/components/PrintLabelButton.svelte';
    import ChevronRight from 'lucide-svelte/icons/chevron-right';
    import Package from 'lucide-svelte/icons/package';
    import BoxIcon from 'lucide-svelte/icons/box';

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
    

    // 统计
    // a_volume = 可用容积（剩余空间）；occupiedVolume = 已占用容积
    const occupiedVolume = $derived(container.volume - container.a_volume);
    const remainingPercent = $derived(
        container.volume > 0
            ? Math.min(100, Math.max(0, Math.round((container.a_volume / container.volume) * 100)))
            : 0
    );
    const descendantCount = $derived(descendants.length);
    const storageCount = $derived(storages.length);
    
    // 表格列定义
    const descendantColumns = [
        { key: 'fastCode', title: '容器编码', width: '120px' },
        { key: 'mark', title: '描述' },
        { key: 'usage', title: '剩余空间', width: '110px', align: 'right' as const, cellClass: '!px-0', headerClass: '!px-0' },
        { key: 'capacity', title: '容量', width: '90px', align: 'right' as const, cellClass: '!px-0', headerClass: '!px-0' },
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
    
    let barcodeSvg = $state<SVGSVGElement | null>(null);

    async function renderBarcode() {
        if (!barcodeSvg || !container.barcode) return;

        const { default: JsBarcode } = await import('jsbarcode');
        JsBarcode(barcodeSvg, container.barcode, {
            format: 'CODE128',
            displayValue: false,
            width: 1,
            height: 24,
            margin: 0,
            background: 'transparent',
            lineColor: '#111827'
        });
    }

    onMount(() => {
        renderBarcode();
    });

    $effect(() => {
        if (barcodeSvg && container.barcode) {
            renderBarcode();
        }
    });

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
            <EditButton
                onClick={goToEdit}
                action="edit"
            />
            <EditButton
                onClick={goToAddChild}
                action="add"
            />
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
                            capacity: d.base_volume,
                            usage: `${formatNumber(d.available_volume)} / ${formatNumber(d.base_volume)}`
                        }))}
                        columns={descendantColumns}
                        clickable={true}
                        onRowClick={(row: { fastCode: string }) => goto(`/container/${row.fastCode}`, { noScroll: true })}
                    >
                        {#snippet cellRender({ item, column })}
                            {#if column.key === 'fastCode'}
                                <a href="/container/{item.fastCode}" class="text-blue-600 hover:text-blue-800 font-medium">
                                    {item.fastCode}
                                </a>
                            {:else if column.key === 'capacity'}
                                <span class="font-mono text-sm text-gray-900">{formatNumber(item.capacity)}</span>
                            {:else if column.key === 'usage'}
                                <div class="text-sm flex justify-end">
                                    <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            class="h-full bg-green-500"
                                            style="width: {item.base_volume > 0 ? Math.min(100, Math.max(0, Math.round((item.available_volume / item.base_volume) * 100))) : 0}%"
                                        ></div>
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
                        onRowClick={(row: { item_id: number }) => goToItem(row.item_id)}
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
                <!-- 容量卡片 -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 class="text-lg font-semibold mb-6 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <BoxIcon class="h-5 w-5 text-blue-600" />
                            <span>{container.fastCode}</span>
                        </div>
                        <span title={container.barcode} class="inline-flex items-center gap-2">
                            <svg bind:this={barcodeSvg} class="h-8" aria-label="Container barcode"></svg>
                            <PrintLabelButton
                                code={container.fastCode}
                                barcode={container.barcode}
                            />
                        </span>
                    </h2>
                    <div class="border-t border-gray-200"></div>

                    <div class="space-y-6">
                        <div class="flex justify-between mb-2">
                            <p class="text-sm text-gray-600 mb-4">{container.mark || '-'}</p>
                        </div>
                        <div>
                            <div class="flex justify-between mb-2">
                                <span class="text-sm text-gray-600">剩余空间</span>
                                <span class="font-semibold text-gray-900">
                                    {formatNumber(container.a_volume)} / {formatNumber(container.volume)}
                                </span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    class="h-full bg-green-500 transition-all"
                                    style="width: {remainingPercent}%"
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">总容量</span>
                                    <span class="text-gray-900 font-mono">{formatNumber(container.volume)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">已占用</span>
                                    <span class="text-gray-900 font-mono">{formatNumber(occupiedVolume)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">可用</span>
                                    <span class="text-gray-900 font-mono">{formatNumber(container.a_volume)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                                        onclick={(e) => {
                                            e.preventDefault();
                                            goto(`/container/${sibling.fastCode}`, { noScroll: true });
                                        }}
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