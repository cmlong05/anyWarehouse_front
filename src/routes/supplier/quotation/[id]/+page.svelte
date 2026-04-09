<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI } from '$lib/api';
    import type { Quotation } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import EditButton from '$lib/components/EditButton.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import QuotationDetailBody from '$lib/components/QuotationDetailBody.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let quotation = $state<Quotation | null>(null);
    let loading = $state(true);
    let error = $state('');
    
    const id = $derived(parseInt(page.params.id || '0'));

    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        { label: quotation?.supplier_detail?.name ?? '供应商', href: quotation ? `/supplier/${quotation.supplier}` : '/supplier' },
    ]);
    
    async function loadQuotation() {
        loading = true;
        error = '';
        try {
            quotation = await quotationAPI.get(id);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
        }
    }
    
    function editQuotation() {
        goto(`/supplier/quotation/${id}/edit`);
    }
    
    async function deleteQuotation() {
        if (!confirm('确定要删除此报价吗？此操作无法撤销。')) {
            return;
        }
        try {
            await quotationAPI.delete(id);
            goto(`/supplier/${quotation?.supplier}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
        }
    }
    
    async function togglePreferred() {
        if (!quotation) return;
        try {
            const updated = await quotationAPI.setPreferred(id, !quotation.is_preferred);
            quotation = { ...quotation, is_preferred: updated.is_preferred };
        } catch (err) {
            error = err instanceof Error ? err.message : '操作失败';
        }
    }
    
    onMount(loadQuotation);
</script>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />

    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <div class="mt-4">
            <Alert error={error} />
            <div class="flex gap-4 mt-4">
                <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={() => goto('/supplier')}>
                    返回供应商列表
                </button>
            </div>
        </div>
    {:else if quotation}
        <PageHeader title="报价详情" mb="md">
            {#snippet left()}
                <span class="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1">NO.{quotation?.id?.toString().padStart(6, '0') || '-'}</span>
                {#if quotation?.is_preferred}
                    <span class="bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">★ 首选报价</span>
                {:else}
                    <span class="bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-full font-medium">标准报价</span>
                {/if}
            {/snippet}
            {#snippet actions()}
                <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm" onclick={togglePreferred}>
                    {quotation?.is_preferred ? '取消首选' : '设为首选'}
                </button>
                <EditButton
                    onClick={editQuotation}
                    action="edit"
                />
                <button class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm" onclick={deleteQuotation}>
                    删除
                </button>
            {/snippet}
        </PageHeader>

        <QuotationDetailBody
            partnerTitle="供应商信息"
            partnerCodeLabel="供应商编号"
            partnerCode={quotation.supplier_detail?.code}
            partnerName={quotation.supplier_detail?.name}
            partnerHref={`/supplier/${quotation.supplier}`}
            itemId={quotation.item}
            itemSku={quotation.item_detail?.SKU}
            itemName={quotation.item_detail?.name}
            itemWeight={quotation.item_detail?.weight}
            price={quotation.price}
            currency={quotation.currency}
            minQuantity={quotation.min_quantity}
            totalValue={quotation.total_cost}
            totalLabel="总成本"
            leadTimeDays={quotation.lead_time_days}
            validFrom={quotation.valid_from}
            validUntil={quotation.valid_until}
            partnerSku={quotation.partner_sku}
            note={quotation.note}
            createdAt={quotation.created_at}
            updatedAt={quotation.updated_at}
        />
    {/if}
</PageContainer>
