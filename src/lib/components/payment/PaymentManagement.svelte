<script lang="ts">
    import { onMount } from 'svelte';
    import { Alert } from '$lib/components/feedback';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { ConfirmModal } from '$lib/components/modal';
    import { DataTable, FilterPanel, FormInput, FormSelect, Pagination } from '$lib/components/ui';
    import {
        customerAPI,
        purchaseOrderPaymentRecordAPI,
        salesOrderPaymentRecordAPI,
        supplierAPI
    } from '$lib/api';
    import type {
        PurchaseOrderPaymentRecord,
        SalesOrderPaymentRecord
    } from '$lib';
    import {
        buildPaymentRecordQuery,
        type PaymentManagementMode
    } from '$lib/payment/management';
    import { safeParseFloat } from '$lib/utils';
    import PaymentRecordFormModal from './PaymentRecordFormModal.svelte';

    type PaymentRecord = SalesOrderPaymentRecord | PurchaseOrderPaymentRecord;
    type PartnerOption = {
        id: number;
        name: string;
        code?: string;
    };

    interface Props {
        mode: PaymentManagementMode;
    }

    let { mode }: Props = $props();

    const pageSize = 20;
    const copy = $derived(
        mode === 'receivable'
            ? {
                  title: '收款管理',
                  subtitle: '集中查看和管理客户销售订单的收款记录',
                  noun: '收款',
                  partnerLabel: '客户',
                  partnerTitle: '客户',
                  allPartners: '全部客户',
                  orderHref: (id: number) => `/customer/sales-order/${id}`
              }
            : {
                  title: '付款管理',
                  subtitle: '集中查看和管理供应商采购订单的付款记录',
                  noun: '付款',
                  partnerLabel: '供应商',
                  partnerTitle: '供应商',
                  allPartners: '全部供应商',
                  orderHref: (id: number) => `/supplier/purchase-order/${id}`
              }
    );

    let records = $state<PaymentRecord[]>([]);
    let partners = $state<PartnerOption[]>([]);
    let loading = $state(true);
    let error = $state('');
    let success = $state('');
    let page = $state(1);
    let totalCount = $state(0);
    let totalPages = $state(1);

    let partnerFilter = $state('');
    let searchFilter = $state('');
    let paymentMethodFilter = $state('');
    let dateFromFilter = $state('');
    let dateToFilter = $state('');

    let formOpen = $state(false);
    let editingRecord = $state<PaymentRecord | null>(null);
    let deleteTarget = $state<PaymentRecord | null>(null);
    let deleting = $state(false);

    const partnerOptions = $derived([
        { value: '', label: copy.allPartners },
        ...partners.map((partner) => ({
            value: String(partner.id),
            label: partner.code ? `${partner.code} · ${partner.name}` : partner.name
        }))
    ]);

    const columns = $derived([
        { key: 'received_date', title: '日期', width: '120px' },
        { key: 'partner_name', title: copy.partnerTitle, width: '180px' },
        { key: 'order_number', title: '订单号', width: '170px' },
        { key: 'amount', title: `${copy.noun}金额`, width: '150px', align: 'right' as const },
        { key: 'payment_method', title: `${copy.noun}方式`, width: '120px' },
        { key: 'reference_number', title: '凭证号', width: '160px' },
        { key: 'attachment_name', title: '附件', width: '120px' },
        { key: 'notes', title: '备注', width: '220px' },
        { key: 'actions', title: '操作', width: '190px', noClick: true, align: 'right' as const }
    ]);

    function getPartnerName(record: PaymentRecord): string {
        return 'customer_name' in record ? record.customer_name : record.supplier_name;
    }

    function getOrderId(record: PaymentRecord): number {
        return 'sales_order' in record ? record.sales_order : record.purchase_order;
    }

    function getOrderNumber(record: PaymentRecord): string {
        return record.order_number;
    }

    async function loadPartners() {
        try {
            const rows =
                mode === 'receivable'
                    ? await customerAPI.listBrief()
                    : await supplierAPI.listBrief();
            partners = rows.map((partner) => ({
                id: partner.id,
                name: partner.name,
                code: partner.code
            }));
        } catch (loadError) {
            error =
                loadError instanceof Error
                    ? loadError.message
                    : `${copy.partnerLabel}列表加载失败`;
        }
    }

    async function loadRecords() {
        loading = true;
        error = '';
        try {
            const query = buildPaymentRecordQuery(
                mode,
                {
                    partnerId: partnerFilter,
                    search: searchFilter.trim(),
                    paymentMethod: paymentMethodFilter.trim(),
                    dateFrom: dateFromFilter,
                    dateTo: dateToFilter
                },
                { page, pageSize }
            );
            const result =
                mode === 'receivable'
                    ? await salesOrderPaymentRecordAPI.listForManagement(query)
                    : await purchaseOrderPaymentRecordAPI.listForManagement(query);
            records = result.results;
            totalCount = result.count;
            totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
            if (page > totalPages) {
                page = totalPages;
                await loadRecords();
            }
        } catch (loadError) {
            error =
                loadError instanceof Error
                    ? loadError.message
                    : `${copy.noun}记录加载失败`;
            records = [];
        } finally {
            loading = false;
        }
    }

    function applyFilters() {
        page = 1;
        void loadRecords();
    }

    function resetFilters() {
        partnerFilter = '';
        searchFilter = '';
        paymentMethodFilter = '';
        dateFromFilter = '';
        dateToFilter = '';
        page = 1;
        void loadRecords();
    }

    function openCreate() {
        editingRecord = null;
        success = '';
        formOpen = true;
    }

    function openEdit(record: PaymentRecord) {
        editingRecord = record;
        success = '';
        formOpen = true;
    }

    async function handleSaved() {
        success = `${copy.noun}记录已保存。`;
        await Promise.all([loadRecords(), loadPartners()]);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        deleting = true;
        error = '';
        success = '';
        try {
            if (mode === 'receivable') {
                await salesOrderPaymentRecordAPI.delete(deleteTarget.id);
            } else {
                await purchaseOrderPaymentRecordAPI.delete(deleteTarget.id);
            }
            success = `${copy.noun}记录已删除。`;
            deleteTarget = null;
            await loadRecords();
        } catch (deleteError) {
            error =
                deleteError instanceof Error
                    ? deleteError.message
                    : `删除${copy.noun}记录失败`;
        } finally {
            deleting = false;
        }
    }

    onMount(() => {
        void loadPartners();
        void loadRecords();
    });
</script>

<PageContainer maxWidth="2xl" padding="md" py="md">
    <PageHeader title={copy.title} subtitle={copy.subtitle}>
        {#snippet actions()}
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                onclick={openCreate}
            >
                <span class="text-lg leading-none">+</span>
                新增{copy.noun}
            </button>
        {/snippet}
    </PageHeader>

    {#if error}
        <Alert {error} onDismiss={() => (error = '')} />
    {/if}
    {#if success}
        <div class="mb-4 flex items-start justify-between gap-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
            <span>{success}</span>
            <button
                type="button"
                class="text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
                onclick={() => (success = '')}
                aria-label="关闭"
            >
                ✕
            </button>
        </div>
    {/if}

    <FilterPanel onApply={applyFilters} onReset={resetFilters}>
        <FormSelect
            label={copy.partnerLabel}
            name="payment-partner-filter"
            value={partnerFilter}
            options={partnerOptions}
            class="min-w-[190px]"
            onchange={(value) => (partnerFilter = value)}
        />
        <FormInput
            label="搜索"
            name="payment-search"
            value={searchFilter}
            placeholder="订单号、客户/供应商、凭证号"
            oninput={(value) => (searchFilter = value)}
        />
        <FormInput
            label={`${copy.noun}方式`}
            name="payment-method-filter"
            value={paymentMethodFilter}
            placeholder="银行 / 现金 / PayPal"
            oninput={(value) => (paymentMethodFilter = value)}
        />
        <FormInput
            label="开始日期"
            name="payment-date-from"
            type="date"
            value={dateFromFilter}
            onchange={(value) => (dateFromFilter = value)}
        />
        <FormInput
            label="结束日期"
            name="payment-date-to"
            type="date"
            value={dateToFilter}
            onchange={(value) => (dateToFilter = value)}
        />
    </FilterPanel>

    <DataTable
        data={records}
        {columns}
        {loading}
        emptyText={`暂无${copy.noun}记录`}
        bordered={true}
    >
        {#snippet cellRender({ item, column, value })}
            {#if column.key === 'partner_name'}
                <span class="font-medium text-gray-900">{getPartnerName(item)}</span>
            {:else if column.key === 'order_number'}
                <a
                    href={copy.orderHref(getOrderId(item))}
                    class="font-mono text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {getOrderNumber(item)}
                </a>
            {:else if column.key === 'amount'}
                <span
                    class:font-semibold={true}
                    class:text-red-600={safeParseFloat(item.amount) < 0}
                    class:text-gray-900={safeParseFloat(item.amount) >= 0}
                >
                    {item.currency} {safeParseFloat(item.amount).toFixed(2)}
                </span>
            {:else if column.key === 'reference_number'}
                <span class="font-mono text-xs text-gray-600">{value || '-'}</span>
            {:else if column.key === 'attachment_name'}
                {#if item.attachment_url}
                    <a
                        href={item.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        📎 查看
                    </a>
                {:else}
                    <span class="text-gray-400">-</span>
                {/if}
            {:else if column.key === 'notes'}
                <span class="block max-w-[220px] truncate text-gray-600" title={item.notes}>
                    {item.notes || '-'}
                </span>
            {:else if column.key === 'actions'}
                <div class="flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        onclick={() => openEdit(item)}
                    >
                        编辑
                    </button>
                    <button
                        type="button"
                        class="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onclick={() => (deleteTarget = item)}
                    >
                        删除
                    </button>
                </div>
            {:else}
                {value || '-'}
            {/if}
        {/snippet}
    </DataTable>

    <Pagination
        {page}
        {pageSize}
        {totalCount}
        {totalPages}
        disabled={loading}
        onPageChange={(nextPage) => {
            page = nextPage;
            void loadRecords();
        }}
    />
</PageContainer>

<PaymentRecordFormModal
    open={formOpen}
    {mode}
    record={editingRecord}
    {partners}
    initialPartnerId={partnerFilter}
    onClose={() => {
        formOpen = false;
        editingRecord = null;
    }}
    onSaved={handleSaved}
/>

<ConfirmModal
    isOpen={Boolean(deleteTarget)}
    title={`删除${copy.noun}记录`}
    message={`确定删除这笔${copy.noun}记录吗？删除后订单${copy.noun}状态会自动重算。`}
    itemName={
        deleteTarget
            ? `${deleteTarget.order_number} · ${deleteTarget.currency} ${safeParseFloat(deleteTarget.amount).toFixed(2)}`
            : ''
    }
    loading={deleting}
    onConfirm={() => void confirmDelete()}
    onCancel={() => {
        if (!deleting) deleteTarget = null;
    }}
/>
