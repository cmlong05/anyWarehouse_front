<!-- 新增客户页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { CustomerFormData } from '$lib/schemas';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
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

<PageContainer maxWidth="md">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader title="添加客户" subtitle="填写客户基本信息" />
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    <div class="bg-white p-8 rounded-lg border border-gray-200 md:p-6 sm:p-4">
        <CustomerForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="创建客户"
            {loading}
        />
    </div>
</PageContainer>