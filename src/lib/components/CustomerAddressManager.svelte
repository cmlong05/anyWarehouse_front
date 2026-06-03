<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import type { CustomerAddress, CustomerAddressFormData } from '$lib';
    import { customerAddressAPI } from '$lib/api';
    import AddressCard from '$lib/components/customer/AddressCard.svelte';

    interface Props {
        customerId: number;
        addresses?: CustomerAddress[];
        onRefresh?: () => void;
    }

    let { customerId, addresses = $bindable([]), onRefresh }: Props = $props();

    let showModal = $state(false);
    let editingId = $state<number | null>(null);
    let saving = $state(false);
    let error = $state('');

    const emptyForm = (): CustomerAddressFormData => ({
        company: '',
        tax_number: '',
        contact_name: '',
        phone: '',
        mobile: '',
        email: '',
        country: '',
        province: '',
        city: '',
        district: '',
        postal_code: '',
        detail_address: '',
        detail_address2: '',
        is_default: false,
        status: 'ACTIVE',
        remark: '',
    });

    let formData = $state<CustomerAddressFormData>(emptyForm());
    let initialFormData = $state<CustomerAddressFormData>(emptyForm());
    const formFieldKeys = Object.keys(emptyForm()) as (keyof CustomerAddressFormData)[];

    const isFormDirty = $derived.by(() =>
        formFieldKeys.some((key) => formData[key] !== initialFormData[key])
    );

    function startAdd() {
        formData = emptyForm();
        initialFormData = { ...formData };
        editingId = null;
        showModal = true;
        error = '';
    }

    function startEdit(addr: CustomerAddress) {
        formData = {
            company: addr.company || '',
            tax_number: addr.tax_number || '',
            contact_name: addr.contact_name || '',
            phone: addr.phone || '',
            mobile: addr.mobile || '',
            email: addr.email || '',
            country: addr.country || '',
            province: addr.province || '',
            city: addr.city || '',
            district: addr.district || '',
            postal_code: addr.postal_code || '',
            detail_address: addr.detail_address || '',
            detail_address2: addr.detail_address2 || '',
            is_default: addr.is_default,
            status: addr.status,
            remark: addr.remark || '',
        };
        initialFormData = { ...formData };
        editingId = addr.id;
        showModal = true;
        error = '';
    }

    function closeModal() {
        showModal = false;
        editingId = null;
        error = '';
    }

    function requestCloseModal(force = false) {
        if (force || !isFormDirty) closeModal();
    }

    function validateForm(): string {
        return '';
    }

    async function handleSave() {
        const validationError = validateForm();
        if (validationError) {
            error = validationError;
            return;
        }

        saving = true;
        error = '';
        try {
            if (editingId !== null) {
                await customerAddressAPI.update(editingId, { ...formData, customer: customerId });
            } else {
                await customerAddressAPI.create({ ...formData, customer: customerId });
            }
            closeModal();
            await reload();
        } catch (err) {
            error = getErrorMessage(err, '保存失败');
        } finally {
            saving = false;
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('确认删除该地址？')) return;
        try {
            await customerAddressAPI.delete(id);
            await reload();
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
        }
    }

    async function handleSetDefault(addr: CustomerAddress) {
        if (addr.is_default) return;
        try {
            await customerAddressAPI.update(addr.id, { ...addr, is_default: true, customer: customerId });
            await reload();
        } catch (err) {
            error = getErrorMessage(err, '设置默认失败');
        }
    }

    async function reload() {
        try {
            addresses = await customerAddressAPI.listAddresses({ customer_id: customerId });
            onRefresh?.();
        } catch (err) {
            error = getErrorMessage(err, '加载失败');
        }
    }

</script>

<svelte:window
    onkeydown={(e) => {
        if (e.key === 'Escape') requestCloseModal();
    }}
/>

<!-- 地址信息标题 + 新增按钮 -->
<div class="flex items-center justify-between mb-3">
    <h3 class="text-base font-semibold text-gray-700">地址信息</h3>
    <button onclick={startAdd} class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ 新增</button>
</div>

{#if error}
    <div class="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{error}</div>
{/if}

<!-- 地址卡片列表 -->
{#if addresses.length === 0}
    <div class="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
        暂无地址，点击「+ 新增」添加
    </div>
{:else}
    <div class="space-y-2">
        {#each addresses as addr (addr.id)}
            <AddressCard
                {addr}
                onSetDefault={handleSetDefault}
                onEdit={startEdit}
                onDelete={handleDelete}
            />
        {/each}
    </div>
{/if}

<!-- 新增/编辑弹窗 -->
{#if showModal}
    <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={(e) => { if (e.target === e.currentTarget) requestCloseModal(); }}
        onkeydown={(e) => {
            if (e.key === 'Escape') requestCloseModal();
        }}
    >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 class="font-semibold text-gray-800">{editingId !== null ? '编辑地址' : '新增地址'}</h3>
                <button type="button" onclick={() => requestCloseModal(true)} class="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">&times;</button>
            </div>
            <div class="px-6 py-4">
                {#if error}
                    <div class="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
                {/if}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label for="addr-company" class="block text-sm text-gray-600 mb-1">公司名称</label>
                        <input id="addr-company" bind:value={formData.company} placeholder="公司或单位名称" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-contact" class="block text-sm text-gray-600 mb-1">收件人</label>
                        <input id="addr-contact" bind:value={formData.contact_name} placeholder="收件人姓名" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-tax-number" class="block text-sm text-gray-600 mb-1">税号</label>
                        <input id="addr-tax-number" bind:value={formData.tax_number} placeholder="纳税人识别号（可选）" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-phone" class="block text-sm text-gray-600 mb-1">电话</label>
                        <input id="addr-phone" bind:value={formData.phone} placeholder="联系电话" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-mobile" class="block text-sm text-gray-600 mb-1">手机</label>
                        <input id="addr-mobile" bind:value={formData.mobile} placeholder="手机号码" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-email" class="block text-sm text-gray-600 mb-1">邮箱</label>
                        <input id="addr-email" bind:value={formData.email} type="email" placeholder="电子邮箱" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-country" class="block text-sm text-gray-600 mb-1">国家</label>
                        <input id="addr-country" bind:value={formData.country} placeholder="国家" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-province" class="block text-sm text-gray-600 mb-1">州/省</label>
                        <input id="addr-province" bind:value={formData.province} placeholder="州/省" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-city" class="block text-sm text-gray-600 mb-1">城市</label>
                        <input id="addr-city" bind:value={formData.city} placeholder="城市" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-district" class="block text-sm text-gray-600 mb-1">区/县</label>
                        <input id="addr-district" bind:value={formData.district} placeholder="区/县" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label for="addr-postal" class="block text-sm text-gray-600 mb-1">邮编</label>
                        <input id="addr-postal" bind:value={formData.postal_code} placeholder="邮政编码" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div class="sm:col-span-2">
                        <label for="addr-line1" class="block text-sm text-gray-600 mb-1">地址1</label>
                        <input id="addr-line1" bind:value={formData.detail_address} placeholder="街道地址" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div class="sm:col-span-2">
                        <label for="addr-line2" class="block text-sm text-gray-600 mb-1">地址2</label>
                        <input id="addr-line2" bind:value={formData.detail_address2} placeholder="楼层、单元等（可选）" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div class="sm:col-span-2">
                        <label for="addr-remark" class="block text-sm text-gray-600 mb-1">备注</label>
                        <input id="addr-remark" bind:value={formData.remark} placeholder="备注（可选）" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" bind:checked={formData.is_default} class="accent-blue-500" />
                            设为默认地址
                        </label>
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button type="button" onclick={() => requestCloseModal(true)} class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm cursor-pointer">取消</button>
                <button type="button" onclick={() => void handleSave()} disabled={saving} class="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </div>
    </div>
{/if}
