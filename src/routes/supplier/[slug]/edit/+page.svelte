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
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    
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
        <div class="actions">
            <button class="btn btn-secondary" onclick={() => goto('/supplier')}>
                返回列表
            </button>
            <button class="btn btn-primary" onclick={loadSupplier}>
                重试
            </button>
        </div>
    {:else if supplier}
        <PageHeader title="编辑供应商" subtitle={supplier.name} mb="md" />
        
        {#if error}
            <Alert error={error} onDismiss={() => error = ''} />
        {/if}
        
        <div class="form-container">
            <SupplierForm 
                {supplier}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="保存修改"
                loading={saving}
            />
        </div>
    {/if}
</PageContainer>

<style>
    .form-container {
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .form-container {
            padding: 1.5rem 1rem;
        }
    }
</style>
