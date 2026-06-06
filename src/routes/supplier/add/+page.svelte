<!-- 新增供应商页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { supplierAPI } from '$lib/api';
    import type { SupplierCreateRequest } from '$lib';
    import { SupplierForm } from '$lib/components';
    import { Alert } from '$lib/components';
    import { Breadcrumb } from '$lib/components';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let loading = $state(false);
    let error = $state('');
    
    const breadcrumbs = [
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        { label: '添加供应商', href: '/supplier/add' },
    ];
    
    async function handleSubmit(data: SupplierCreateRequest) {
        loading = true;
        error = '';
        
        try {
            const supplier = await supplierAPI.create(data);
            goto(`/supplier/${supplier.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建供应商失败';
            loading = false;
        }
    }
    
    function handleCancel() {
        goto('/supplier');
    }
</script>

<svelte:head>
    <title>添加供应商</title>
</svelte:head>

<PageContainer maxWidth="md">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader title="添加供应商" subtitle="填写供应商基本信息" />
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    <div class="bg-white p-8 rounded-lg border border-gray-200 md:p-6 sm:p-4">
        <SupplierForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="创建供应商"
            {loading}
        />
    </div>
</PageContainer>