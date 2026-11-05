<script lang="ts">
    import { quotationAPI } from '$lib/api';
    import type { Quotation } from '$lib';
    import { NumberStepper } from '$lib/components/ui';
    import { BaseModal } from '$lib/components/modal';

    interface Props {
        quotation: Quotation;
        open: boolean;
        onclose: () => void;
        onsuccess: () => void;
    }

    let { quotation, open, onclose, onsuccess }: Props = $props();

    let newPrice = $state<number | undefined>(undefined);
    let note = $state('');
    let submitting = $state(false);
    let error = $state('');

    function validate(price: number | undefined): string | null {
        if (price === undefined || price === null) return '请输入价格';
        if (price <= 0) return '请输入有效的价格';
        return null;
    }

    function reset() {
        newPrice = undefined;
        note = '';
        error = '';
    }

    async function handleSubmit() {
        const validationError = validate(newPrice);
        if (validationError) {
            error = validationError;
            return;
        }
        error = '';
        submitting = true;
        try {
            await quotationAPI.createVersion(quotation.id, {
                price: String(newPrice),
                note: note || '',
            });
            reset();
            onsuccess();
        } catch (err) {
            error = err instanceof Error ? err.message : '创建失败';
        } finally {
            submitting = false;
        }
    }

    function handleClose() {
        reset();
        onclose();
    }
</script>

<BaseModal
    open={open}
    title="新建报价"
    size="md"
    busy={submitting}
    onClose={handleClose}
>
            <div class="px-6 py-4 space-y-4">
                <!-- 当前价格 -->
                <div>
                    <span class="block text-sm font-medium text-gray-500">当前价格</span>
                    <p class="mt-1 text-2xl font-bold text-gray-900">
                        {Number(quotation.current_version?.price ?? '0').toFixed(2)} {quotation.currency}
                    </p>
                    {#if quotation.current_version?.created_at}
                        <p class="text-xs text-gray-400 mt-1">
                            自 {new Date(quotation.current_version.created_at).toLocaleDateString('zh-CN')} 起
                            {#if quotation.current_version.note}
                                · {quotation.current_version.note}
                            {/if}
                        </p>
                    {/if}
                </div>

                <!-- 新价格 -->
                <div>
                    <label for="adjustPrice" class="block text-sm font-medium text-gray-700">
                        新价格 <span class="text-red-500">*</span>
                    </label>
                    <NumberStepper
                        value={newPrice}
                        min={0.01}
                        step={0.01}
                        placeholder="0.00"
                        disabled={submitting}
                        onchange={(v) => newPrice = v ?? undefined}
                    />
                    {#if error}
                        <p class="mt-1 text-sm text-red-600">{error}</p>
                    {/if}
                </div>

                <!-- 备注 -->
                <div>
                    <label for="adjustNote" class="block text-sm font-medium text-gray-700">版本备注</label>
                    <input
                        id="adjustNote"
                        type="text"
                        bind:value={note}
                        maxlength="200"
                        placeholder="如：年度调价、双11促销"
                        disabled={submitting}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    />
                </div>
            </div>

    {#snippet footer()}
            <div class="flex justify-end gap-3 px-6 py-4">
                <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onclick={handleClose}
                    disabled={submitting}
                >
                    取消
                </button>
                <button
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    onclick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? '提交中...' : '确认新建'}
                </button>
            </div>
    {/snippet}
</BaseModal>
