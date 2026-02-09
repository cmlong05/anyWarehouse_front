<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { supplierAPI } from '$lib/api';
    import type { Supplier, SupplierCreateRequest } from '$lib';
    import SupplierForm from '$lib/components/SupplierForm.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    
    const id = $derived(parseInt($page.params.slug));
    
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

<div class="content-container">
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
        <div class="page-header">
            <h1>编辑供应商</h1>
            <p class="subtitle">{supplier.name}</p>
        </div>
        
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
</div>

<style>
    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    .page-header {
        margin-bottom: 2rem;
    }
    
    .page-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .subtitle {
        margin: 0;
        color: #6b7280;
        font-size: 1rem;
    }
    
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
    
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #4b5563;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .form-container {
            padding: 1.5rem 1rem;
        }
    }
</style>
