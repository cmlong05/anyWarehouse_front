<!-- 物料详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { logger } from '$lib/logger';
    import { goto } from '$app/navigation';
    import type { ItemSet, QuotationBrief, StorageContainer } from '$lib';
    import type { ItemVariantInfo } from '$lib/types/variant';
    import { config } from '$lib/config';
    import { untrack } from 'svelte';
    import { resolveItemDisplayPrice } from '$lib/utils';
    import { getErrorMessage } from '$lib/utils/errors';
    import { inventoryMovementAPI } from '$lib/api';
    import { useOutboundFlow } from '$lib/composables/useOutboundFlow.svelte';
    import { useInventoryCheck } from '$lib/composables/useInventoryCheck.svelte';
    import { ItemComponentManager } from '$lib/components';
    import { ItemVariantManager } from '$lib/components';
    import { ItemExternalLinksTab } from '$lib/components';
    import { ItemQuotationsTab } from '$lib/components';
    import OutboundConfirmModal from '$lib/components/item/OutboundConfirmModal.svelte';
    import TransferConfirmModal from '$lib/components/item/TransferConfirmModal.svelte';
    import ItemDescriptionCard from '$lib/components/item/ItemDescriptionCard.svelte';
    import ItemTabsNav, { type ItemDetailTab } from '$lib/components/item/ItemTabsNav.svelte';
    import ItemInventoryTab from '$lib/components/item/ItemInventoryTab.svelte';
    import ItemHeaderCard from '$lib/components/item/ItemHeaderCard.svelte';
    import ItemSidebar from '$lib/components/item/ItemSidebar.svelte';

    let { data } = $props<{
        data: {
            itemDetail: ItemSet;
            quotations: QuotationBrief[];
            bestPrice: { price: string; supplier: string; quotation_id: number } | null;
            variantInfo: ItemVariantInfo | null;
            aliexpressBaseUrl?: string;
            ebayBaseUrl?: string;
        }
    }>();

    let platformLinkCount = $state(untrack(() => data.itemDetail.item.external_links?.length ?? 0));

    // 判断是否为变体母版（处理字符串和布尔值）
    const isVariantTemplate = $derived(
        data.itemDetail.item.is_variant_template === true ||
        data.itemDetail.item.is_variant_template === 'true' ||
        data.itemDetail.item.is_variant_template === 1
    );

    // 默认标签：母版显示变体，普通Item显示库存
    let activeTab = $state<ItemDetailTab>(
        untrack(() => (
            data.itemDetail.item.is_variant_template === true ||
            data.itemDetail.item.is_variant_template === 'true' ||
            data.itemDetail.item.is_variant_template === 1
        )) ? 'variants' : 'overview'
    );

    const outbound = useOutboundFlow({
        getStorages: () => data.itemDetail.storages,
        onChange: () => { data = { ...data }; },
    });

    const inventoryCheck = useInventoryCheck({
        getItemId: () => data.itemDetail.item.id,
        onSuccess: (updated) => {
            data = {
                ...data,
                itemDetail: {
                    ...data.itemDetail,
                    item: {
                        ...data.itemDetail.item,
                        inventory_checked_at: updated.inventory_checked_at,
                    },
                },
            };
        },
    });

    type TransferPending = {
        fromStorageId: number;
        toStorageId: number;
        fromContainerId: number;
        toContainerId: number;
        fromContainerCode: string;
        toContainerCode: string;
        fromQuantity: number;
        toQuantity: number;
    } | null;

    let transferPending = $state<TransferPending>(null);
    let transferProcessing = $state(false);
    let transferError = $state('');
    let transferFlash = $state<Record<number, number>>({});

    function requestTransferByDrop(fromStorageId: number, toStorageId: number) {
        const source = data.itemDetail.storages.find((s: StorageContainer) => s.id === fromStorageId);
        const target = data.itemDetail.storages.find((s: StorageContainer) => s.id === toStorageId);
        if (!source || !target || source.id === target.id || source.quantity <= 0) return;
        transferError = '';
        transferPending = {
            fromStorageId: source.id,
            toStorageId: target.id,
            fromContainerId: source.container_id,
            toContainerId: target.container_id,
            fromContainerCode: source.container_fastCode,
            toContainerCode: target.container_fastCode,
            fromQuantity: source.quantity,
            toQuantity: target.quantity,
        };
    }

    function cancelTransfer() {
        transferPending = null;
        transferError = '';
    }

    async function refreshItemDetail() {
        const response = await fetch(`${config.API_BASE_URL}/product/item/${data.itemDetail.item.id}/`);
        if (!response.ok) throw new Error('刷新库存失败');
        const itemDetail: ItemSet = await response.json();
        data = { ...data, itemDetail };
    }

    async function confirmTransfer(quantity: number) {
        if (!transferPending || transferProcessing) return;
        transferProcessing = true;
        transferError = '';
        const fromId = transferPending.fromStorageId;
        const toId = transferPending.toStorageId;
        try {
            await inventoryMovementAPI.create({
                movement_type: 'transfer',
                item: data.itemDetail.item.id,
                quantity,
                from_container: transferPending.fromContainerId,
                to_container: transferPending.toContainerId,
            });
            transferPending = null;
            // 先触发动画，动画结束后再刷新数量
            outbound.quantityDelta[fromId] = quantity;
            outbound.quantityFlash[fromId] = true;
            transferFlash[toId] = quantity;
            setTimeout(async () => {
                outbound.quantityFlash[fromId] = false;
                delete transferFlash[toId];
                delete outbound.quantityDelta[fromId];
                await refreshItemDetail();
            }, 1500);
        } catch (err) {
            const detail = (err && typeof err === 'object' && 'detail' in err)
                ? (err as { detail?: unknown }).detail
                : undefined;
            transferError = detail !== undefined ? JSON.stringify(detail) : getErrorMessage(err, '移库失败');
        } finally {
            transferProcessing = false;
        }
    }

    // 计算显示价格：首选供应商报价 > item字段价格 > 供应商最高报价
    const displayPrice = $derived.by(() =>
        resolveItemDisplayPrice(data.quotations, data.itemDetail.item)
    );

    // 刷新变体数据
    async function refreshVariantInfo() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/${data.itemDetail.item.id}/variants/`);
            if (response.ok) {
                const variantInfo = await response.json();
                data = { ...data, variantInfo };
            }
        } catch (e) {
            logger.error('刷新变体数据失败:', e);
        }
    }

    $effect(() => {
        if (data.itemDetail?.storages) {
            outbound.ensureQuantityValues(data.itemDetail.storages);
        }
    });
</script>

<svelte:head>
    <title>{data.itemDetail.item.name}{data.itemDetail.item.name_en ? ` / ${data.itemDetail.item.name_en}` : ''} | 物品详情</title>
</svelte:head>

<OutboundConfirmModal
    pending={outbound.pending ? { qty: outbound.pending.qty, newQty: outbound.pending.newQty } : null}
    processing={outbound.processing}
    onCancel={outbound.cancel}
    onConfirm={outbound.confirm}
/>

<TransferConfirmModal
    pending={transferPending}
    processing={transferProcessing}
    error={transferError}
    onCancel={cancelTransfer}
    onConfirm={confirmTransfer}
/>

<div class="max-w-7xl mx-auto px-4 pt-3 pb-6">
    <!-- 面包屑导航 -->
    <div class="mb-3 space-y-1">
        {#each data.itemDetail.categories as category, catIndex}
            <nav class="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                <a href="/item/category" class="hover:text-blue-600 transition-colors">主分类</a>
                <span>/</span>
                {#each category.ancestors as ancestor}
                    <a href="/item/category/{ancestor.id}" class="hover:text-blue-600 transition-colors">{ancestor.name}</a>
                    <span>/</span>
                {/each}
                <a href="/item/category/{category.category.id}" class="hover:text-blue-600 transition-colors">{category.category.name}</a>
                <span>/</span>
                {#if catIndex === data.itemDetail.categories.length - 1}
                    <span class="text-gray-900 font-medium font-mono">{data.itemDetail.item.id}</span>
                {/if}
            </nav>
        {/each}
    </div>

    <!-- 主布局：左侧内容 + 右侧边栏 -->
    <div class="flex flex-col lg:flex-row gap-2">
        <!-- 左侧主内容区 -->
        <div class="flex-1 min-w-0">
            <ItemHeaderCard
                item={data.itemDetail.item}
                {isVariantTemplate}
                variantInfo={data.variantInfo}
                {displayPrice}
                totalStock={data.itemDetail.item.total_storage ?? 0}
            />

            <ItemDescriptionCard description={data.itemDetail.item.description} />

            <!-- 标签页内容 -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ItemTabsNav
                    {activeTab}
                    {isVariantTemplate}
                    hasVariantTab={isVariantTemplate || Boolean(data.variantInfo?.is_variant)}
                    variantCount={data.variantInfo?.variants?.length ?? 0}
                    {platformLinkCount}
                    onChange={(tab) => { activeTab = tab; }}
                />

                <div class="bg-white px-5 pb-2 pt-2">
                    {#if activeTab === 'overview'}
                        <ItemInventoryTab
                            {isVariantTemplate}
                            inventoryCheckedAt={data.itemDetail.item.inventory_checked_at}
                            inventoryCheckedFlash={inventoryCheck.flash}
                            isInventoryChecking={inventoryCheck.isChecking}
                            storages={data.itemDetail.storages}
                            quantityValues={outbound.quantityValues}
                            quantityFlash={outbound.quantityFlash}
                            quantityDelta={outbound.quantityDelta}
                            removingIds={outbound.removingIds}
                            {transferFlash}
                            onInventoryCheck={inventoryCheck.check}
                            onInbound={() => { goto(`/storage/add/${data.itemDetail.item.id}`, { noScroll: true }); }}
                            onOutbound={outbound.request}
                            onQuantityChange={outbound.setQuantity}
                            onTransferDrop={requestTransferByDrop}
                        />
                    {/if}

                    {#if activeTab === 'quotations'}
                        <ItemQuotationsTab
                            quotations={data.quotations}
                            bestPrice={data.bestPrice}
                            itemId={data.itemDetail.item.id}
                            itemSKU={data.itemDetail.item.SKU}
                        />
                    {/if}

                    {#if activeTab === 'bom'}
                        <ItemComponentManager
                            itemId={data.itemDetail.item.id}
                            itemSKU={data.itemDetail.item.SKU}
                            itemName={data.itemDetail.item.name}
                        />
                    {/if}

                    {#if activeTab === 'variants'}
                        <ItemVariantManager
                            itemId={data.itemDetail.item.id}
                            itemSku={data.itemDetail.item.SKU}
                            itemName={data.itemDetail.item.name}
                            variantInfo={data.variantInfo}
                            onRefresh={refreshVariantInfo}
                        />
                    {/if}

                    {#if activeTab === 'platforms'}
                        <ItemExternalLinksTab
                            itemId={data.itemDetail.item.id}
                            aliexpressBaseUrl={data.aliexpressBaseUrl}
                            ebayBaseUrl={data.ebayBaseUrl}
                            initialLinks={data.itemDetail.item.external_links ?? []}
                            bind:count={platformLinkCount}
                        />
                    {/if}
                </div>
            </div>
        </div>

        <ItemSidebar categories={data.itemDetail.categories} currentSKU={data.itemDetail.item.SKU} />
    </div>
</div>