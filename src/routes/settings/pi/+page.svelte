<!-- 系统设置页 -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { systemSettingAPI } from '$lib/api';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    let piCompanyName = $state('');
    let piCompanyAddress = $state('');
    let piPaymentTerms = $state('');
    let piDeliveryTerms = $state('');
    let piNotes = $state('');
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
            piCompanyName = data.pi_company_name || '';
            piCompanyAddress = data.pi_company_address || '';
            piPaymentTerms = data.pi_payment_terms || '';
            piDeliveryTerms = data.pi_delivery_terms || '';
            piNotes = data.pi_notes || '';
            updatedAt = data.updated_at || '';
            updatedBy = data.updated_by_username || '-';
        } catch (err) {
            error = err instanceof Error ? err.message : '加载系统设置失败';
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
                pi_company_name: piCompanyName,
                pi_company_address: piCompanyAddress,
                pi_payment_terms: piPaymentTerms,
                pi_delivery_terms: piDeliveryTerms,
                pi_notes: piNotes,
            });
            updatedAt = data.updated_at || updatedAt;
            updatedBy = data.updated_by_username || updatedBy;
            success = 'PI 默认信息已保存';
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

<div class="max-w-4xl mx-auto p-4 sm:p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">PI 默认设置</h1>
        <p class="text-sm text-gray-600 mt-1">用于销售订单 P/I 打印页的默认公司信息与条款。</p>
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
                <label for="piCompanyName" class="block text-sm text-gray-700 mb-1">公司名称</label>
                <input
                    id="piCompanyName"
                    type="text"
                    class="w-full border rounded px-3 py-2"
                    bind:value={piCompanyName}
                    placeholder="Your Company Name"
                />
            </div>

            <div>
                <label for="piCompanyAddress" class="block text-sm text-gray-700 mb-1">公司地址</label>
                <textarea
                    id="piCompanyAddress"
                    rows="3"
                    class="w-full border rounded px-3 py-2"
                    bind:value={piCompanyAddress}
                    placeholder="Company address"
                ></textarea>
            </div>

            <div>
                <label for="piPaymentTerms" class="block text-sm text-gray-700 mb-1">付款条款</label>
                <textarea
                    id="piPaymentTerms"
                    rows="2"
                    class="w-full border rounded px-3 py-2"
                    bind:value={piPaymentTerms}
                    placeholder="T/T 30% deposit, 70% before shipment"
                ></textarea>
            </div>

            <div>
                <label for="piDeliveryTerms" class="block text-sm text-gray-700 mb-1">交货条款</label>
                <textarea
                    id="piDeliveryTerms"
                    rows="2"
                    class="w-full border rounded px-3 py-2"
                    bind:value={piDeliveryTerms}
                    placeholder="FOB Shenzhen"
                ></textarea>
            </div>

            <div>
                <label for="piNotes" class="block text-sm text-gray-700 mb-1">默认备注</label>
                <textarea
                    id="piNotes"
                    rows="3"
                    class="w-full border rounded px-3 py-2"
                    bind:value={piNotes}
                    placeholder="Notes"
                ></textarea>
            </div>

            <div class="flex items-center justify-between pt-2">
                <div class="text-xs text-gray-500">
                    最近更新: {updatedAt ? new Date(updatedAt).toLocaleString('zh-CN') : '-'}
                    <span class="mx-1">|</span>
                    更新人: {updatedBy || '-'}
                </div>
                <button
                    type="button"
                    class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={saving}
                    onclick={saveSettings}
                >
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </div>
    {/if}
</div>
