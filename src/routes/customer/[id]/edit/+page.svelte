<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer } from '$lib';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';

    interface Props {
        data: { customer: Customer };
    }

    let { data }: Props = $props();

    let error = $state('');
    let loading = $state(false);
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);

    const detailPath = $derived(`/customer/${data.customer.id}`);

    async function handleSubmit(payload: Partial<Customer>) {
        loading = true;
        error = '';

        try {
            await customerAPI.update(data.customer.id, payload);
            goto(detailPath);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新客户失败';
            loading = false;
        }
    }

    function handleCancel() {
        goto(detailPath);
    }

    async function handleDelete() {
        deleteLoading = true;
        error = '';

        try {
            await customerAPI.delete(data.customer.id);
            goto('/customer');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除客户失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
</script>

<svelte:head>
    <title>编辑客户 - {data.customer.name}</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6">
    <Breadcrumb items={[
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: data.customer.name, href: detailPath },
        { label: '编辑', href: `${detailPath}/edit` },
    ]} />

    <div class="mb-8 pb-4 border-b border-gray-200 flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
            <h1 class="m-0 text-2xl font-bold text-gray-900">编辑客户</h1>
            <p class="mt-2 text-sm text-gray-500">{data.customer.name}</p>
        </div>
        <button
            type="button"
            class="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition-colors max-md:w-full"
            onclick={handleCancel}
        >
            返回详情
        </button>
    </div>

    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}

    <div class="bg-white p-8 rounded-lg border border-gray-200">
        <CustomerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onDelete={() => showDeleteModal = true}
            initialData={data.customer}
            submitLabel="保存修改"
            deleteLabel="删除客户"
            {loading}
        />
    </div>
</div>

<ConfirmModal
    isOpen={showDeleteModal}
    title="删除客户"
    message="确定要删除以下客户吗？此操作不可撤销。"
    itemName={data.customer.name}
    confirmText="删除"
    cancelText="取消"
    loading={deleteLoading}
    onConfirm={handleDelete}
    onCancel={() => showDeleteModal = false}
/>