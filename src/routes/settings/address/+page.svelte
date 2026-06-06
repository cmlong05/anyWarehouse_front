<!-- 系统设置页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { systemSettingAPI } from '$lib/api';
    import { Alert, Loading } from '$lib/components';

    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    let shippingAddress = $state('');
    let contactPerson = $state('');
    let contactPhone = $state('');
    let updatedAt = $state('');
    let updatedBy = $state('');

    onMount(async () => {
        await loadSettings();
    });

    async function loadSettings() {
        loading = true;
        error = null;
        try {
            const data = await systemSettingAPI.get();
            shippingAddress = data.purchase_order_shipping_address || '';
            contactPerson = data.purchase_order_contact_person || '';
            contactPhone = data.purchase_order_contact_phone || '';
            updatedAt = data.updated_at || '';
            updatedBy = data.updated_by_username || '-';
        } catch (err) {
            error = err instanceof Error ? err.message : '加载设置失败';
        } finally {
            loading = false;
        }
    }

    async function saveSettings() {
        saving = true;
        error = null;
        success = null;
        try {
            const data = await systemSettingAPI.update({
                purchase_order_shipping_address: shippingAddress,
                purchase_order_contact_person: contactPerson,
                purchase_order_contact_phone: contactPhone,
            });
            updatedAt = data.updated_at || updatedAt;
            updatedBy = data.updated_by_username || updatedBy;
            success = '收货地址已保存';
            setTimeout(() => {
                success = null;
            }, 2500);
        } catch (err) {
            error = err instanceof Error ? err.message : '保存失败，请确认账号有管理员权限';
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>采购订单默认收货地址</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 sm:p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">采购订单默认收货地址</h1>
        <p class="text-sm text-gray-600 mt-1">创建采购订单时会自动填入以下收货信息，可在订单中修改。</p>
    </div>

    {#if loading}
        <Loading />
    {:else}
        {#if error}
            <Alert {error} onDismiss={() => (error = null)} />
        {/if}

        {#if success}
            <div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
            </div>
        {/if}

        <div class="rounded-lg bg-white shadow p-4 sm:p-6 space-y-4">
            <div>
                <label for="shippingAddress" class="block text-sm font-medium text-gray-700 mb-1">收货地址</label>
                <textarea
                    id="shippingAddress"
                    rows="3"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    bind:value={shippingAddress}
                    placeholder="默认收货地址"
                ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="contactPerson" class="block text-sm font-medium text-gray-700 mb-1">收货联系人</label>
                    <input
                        id="contactPerson"
                        type="text"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        bind:value={contactPerson}
                        placeholder="联系人姓名"
                    />
                </div>
                <div>
                    <label for="contactPhone" class="block text-sm font-medium text-gray-700 mb-1">收货电话</label>
                    <input
                        id="contactPhone"
                        type="tel"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        bind:value={contactPhone}
                        placeholder="联系电话"
                    />
                </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                <div class="text-xs text-gray-500">
                    最近更新: {updatedAt ? new Date(updatedAt).toLocaleString('zh-CN') : '-'}
                    <span class="mx-1">|</span>
                    更新人: {updatedBy || '-'}
                </div>
                <button
                    type="button"
                    class="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    disabled={saving}
                    onclick={saveSettings}
                >
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </div>
    {/if}
</div>