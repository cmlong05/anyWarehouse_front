<!-- 客户报价详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import { showConfirm } from '$lib/stores/dialog.svelte';
    import type { CustomerQuotation, QuotationVersion } from '$lib';
    import {
        AdjustPriceModal,
        Alert,
        Breadcrumb,
        EditButton,
        Loading,
        QuotationDetailBody,
        VersionHistoryCard,
    } from '$lib/components';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let quotation = $state<CustomerQuotation | null>(null);
    let loading = $state(true);
    let error = $state('');
    let versions = $state<QuotationVersion[]>([]);
    let versionsLoading = $state(false);
    let showPriceModal = $state(false);
    
    const id = $derived(parseInt(page.params.id || '0'));
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: quotation?.customer_detail?.name ?? '客户', href: quotation ? `/customer/${quotation.customer}` : '/customer' },
    ]);
    
    async function loadQuotation() {
        loading = true;
        error = '';
        
        try {
            quotation = await customerQuotationAPI.get(id);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载报价信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function deleteQuotation() {
        if (!quotation) return;
        
        if (!(await showConfirm(`确定要删除此报价吗？\n\n客户: ${quotation.customer_detail?.name}\n物品: ${quotation.item_detail?.SKU || '-'}\n价格: ${quotation.price} ${quotation.currency}`, {
            title: '确认删除报价',
            variant: 'danger',
        }))) {
            return;
        }
        
        try {
            await customerQuotationAPI.delete(id);
            goto(`/customer/${quotation.customer}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
        }
    }

    async function loadVersions() {
        versionsLoading = true;
        try {
            const data = await customerQuotationAPI.getVersions(id);
            versions = data.versions;
        } catch (err) {
            console.error('Failed to load customer quotation versions', err);
        } finally {
            versionsLoading = false;
        }
    }
    
    onMount(() => {
        loadQuotation();
        loadVersions();
    });
</script>

<svelte:head>
    <title>{quotation ? `报价详情 - ${quotation.item_detail?.SKU || '-'}` : '报价详情'}</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    {#if loading}
        <Loading text="加载报价信息..." />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
        <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={() => goto('/customer')}>
                返回客户列表
            </button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors" onclick={loadQuotation}>
                重试
            </button>
        </div>
    {:else if quotation}
        <PageHeader title="报价详情" mb="md">
            {#snippet left()}
                {#if quotation?.is_preferred}
                    <span class="bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">★ 首选报价</span>
                {/if}
            {/snippet}
            {#snippet actions()}
                <button
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    onclick={() => showPriceModal = true}
                >
                    新建报价
                </button>
                <EditButton
                    href={`/customer/quotation/${id}/edit`}
                    action="edit"
                    variant="primary"
                />
                <button class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm" onclick={deleteQuotation}>删除</button>
            {/snippet}
        </PageHeader>
        
        <QuotationDetailBody
            partnerTitle="客户信息"
            partnerCodeLabel="客户编号"
            partnerCode={quotation.customer_detail?.code}
            partnerName={quotation.customer_detail?.name}
            partnerHref={`/customer/${quotation.customer}`}
            itemId={quotation.item}
            itemSku={quotation.item_detail?.SKU}
            itemName={quotation.item_detail?.name}
            itemWeight={quotation.item_detail?.weight}
            price={quotation.price}
            currency={quotation.currency}
            minQuantity={quotation.min_quantity}
            totalValue={quotation.total_price}
            totalLabel="总价"
            leadTimeDays={quotation.lead_time_days}
            validFrom={quotation.valid_from}
            validUntil={quotation.valid_until}
            partnerSku={quotation.partner_sku}
            note={quotation.note}
            createdAt={quotation.created_at}
            updatedAt={quotation.updated_at}
        />

        <div class="mt-6">
            <VersionHistoryCard
                {versions}
                currentVersionId={quotation.current_version?.id ?? null}
                loading={versionsLoading}
            />
        </div>

        <AdjustPriceModal
            {quotation}
            open={showPriceModal}
            createVersion={(quotationId, data) => customerQuotationAPI.createVersion(quotationId, data)}
            onclose={() => showPriceModal = false}
            onsuccess={() => {
                showPriceModal = false;
                loadQuotation();
                loadVersions();
            }}
        />
    {/if}
</PageContainer>
