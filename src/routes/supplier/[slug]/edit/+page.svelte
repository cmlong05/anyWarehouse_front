<!-- 编辑供应商页 -->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { supplierAPI } from '$lib/api';
    import type { Supplier, SupplierCreateRequest } from '$lib';
    import SupplierForm from '$lib/components/SupplierForm.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    
    const id = $derived(parseInt(page.params.slug || '0'));
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        { label: supplier?.name ?? '加载中...', href: `/supplier/${id}` },
        { label: '编辑', href: `/supplier/${id}/edit` },
    ]);
    
    async function loadSupplier() {
        loading = true;
        error = '';
        
        try {
            supplier = await supplierAPI.get(id);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载供应商信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleSubmit(data: SupplierCreateRequest) {
        saving = true;
        error = '';
        
        try {
            await supplierAPI.update(id, data);
            goto(`/supplier/${id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新供应商失败';
            saving = false;
        }
    }

    async function handleDelete() {
        if (!supplier) return;
        deleteLoading = true;
        error = '';

        try {
            await supplierAPI.delete(supplier.id);
            goto('/supplier');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除供应商失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
    
    function handleCancel() {
        goto(`/supplier/${id}`);
    }
    
    onMount(() => {
        loadSupplier();
    });
</script>

<svelte:head>
    <title>{supplier ? `编辑 ${supplier.name}` : '编辑供应商'}</title>
</svelte:head>

<PageContainer maxWidth="md">
    <Breadcrumb items={breadcrumbs} />
    
    {#if loading}
        <Loading text="加载供应商信息..." />
    {:else if error && !supplier}
        <Alert error={error} onDismiss={() => error = ''} />
        <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={() => goto('/supplier')}>
                返回列表
            </button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors" onclick={loadSupplier}>
                重试
            </button>
        </div>
    {:else if supplier}
        <PageHeader title="编辑供应商" subtitle={supplier.name} mb="md" />
        
        {#if error}
            <Alert error={error} onDismiss={() => error = ''} />
        {/if}
        
        <div class="bg-white p-8 rounded-lg border border-gray-200 md:p-6 sm:p-4">
            <SupplierForm 
                {supplier}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onDelete={() => showDeleteModal = true}
                submitLabel="保存修改"
                deleteLabel="删除供应商"
                loading={saving}
            />
        </div>
    {/if}
</PageContainer>

{#if supplier}
    <ConfirmModal
        isOpen={showDeleteModal}
        title="删除供应商"
        message="确定要删除以下供应商吗？此操作不可撤销。"
        itemName={supplier.name}
        confirmText="删除"
        cancelText="取消"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => showDeleteModal = false}
    />
{/if}