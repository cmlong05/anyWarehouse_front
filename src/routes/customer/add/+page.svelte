<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { CustomerFormData } from '$lib/schemas';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    
    let loading = $state(false);
    let error = $state('');
    
    const breadcrumbs = [
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: '添加客户', href: '/customer/add' },
    ];
    
    async function handleSubmit(data: CustomerFormData) {
        loading = true;
        error = '';
        
        try {
            const customer = await customerAPI.create(data);
            goto(`/customer/${customer.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建客户失败';
            loading = false;
        }
    }
    
    function handleCancel() {
        goto('/customer');
    }
</script>

<svelte:head>
    <title>添加客户</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={breadcrumbs} />
    
    <div class="page-header">
        <h1>添加客户</h1>
        <p class="subtitle">填写客户基本信息</p>
    </div>
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    <div class="form-container">
        <CustomerForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="创建客户"
            {loading}
        />
    </div>
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
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .form-container {
            padding: 1.5rem 1rem;
        }
    }
</style>
