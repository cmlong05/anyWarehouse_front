<!-- 销售订单付款面板 -->
<script lang="ts">
    import { salesOrderPaymentRecordAPI } from '$lib/api';
    import type { SalesOrder, SalesOrderPaymentRecordCreateRequest } from '$lib';
    import { safeParseFloat } from '$lib/utils';

    interface Props {
        order: SalesOrder;
        onOrderReload: () => Promise<void>;
    }

    let { order, onOrderReload }: Props = $props();

    let paymentSaving = $state(false);
    let paymentError = $state<string | null>(null);
    let paymentSuccess = $state<string | null>(null);
    let deletingPaymentId = $state<number | null>(null);

    function getTodayLocalDate(): string {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    let paymentForm = $state({
        received_date: getTodayLocalDate(),
        amount: '',
        payment_method: '',
        reference_number: '',
        notes: '',
        attachment: null as File | null,
    });

    function resetPaymentForm() {
        paymentForm = {
            received_date: getTodayLocalDate(),
            amount: '',
            payment_method: '',
            reference_number: '',
            notes: '',
            attachment: null,
        };
    }

    function getPaymentStatusText(status: string | undefined): string {
        if (status === 'paid') return '已收款';
        if (status === 'partial') return '部分收款';
        return '未收款';
    }

    function getPaymentStatusClass(status: string | undefined): string {
        if (status === 'paid') return 'bg-green-100 text-green-700';
        if (status === 'partial') return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-700';
    }

    function handlePaymentAttachmentChange(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        paymentForm.attachment = target.files?.[0] ?? null;
    }

    async function createPaymentRecord() {
        if (paymentSaving) return;

        paymentError = null;
        paymentSuccess = null;

        const amount = Number(paymentForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            paymentError = '请输入有效的收款金额。';
            return;
        }

        paymentSaving = true;
        try {
            const payload: SalesOrderPaymentRecordCreateRequest = {
                sales_order: order.id,
                received_date: paymentForm.received_date,
                amount,
                currency: order.currency,
                payment_method: paymentForm.payment_method || undefined,
                reference_number: paymentForm.reference_number || undefined,
                attachment: paymentForm.attachment,
                notes: paymentForm.notes || undefined,
            };
            await salesOrderPaymentRecordAPI.create(payload);
            paymentSuccess = '收款记录已添加。';
            resetPaymentForm();
            await onOrderReload();
        } catch (e: unknown) {
            paymentError = e instanceof Error ? e.message : '添加收款记录失败。';
        } finally {
            paymentSaving = false;
        }
    }

    async function deletePaymentRecord(recordId: number) {
        if (deletingPaymentId) return;

        deletingPaymentId = recordId;
        paymentError = null;
        paymentSuccess = null;
        try {
            await salesOrderPaymentRecordAPI.delete(recordId);
            paymentSuccess = '收款记录已删除。';
            await onOrderReload();
        } catch (e: unknown) {
            paymentError = e instanceof Error ? e.message : '删除收款记录失败。';
        } finally {
            deletingPaymentId = null;
        }
    }
</script>

<div class="bg-white rounded-lg p-6 shadow mb-6">
    <div class="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h3 class="text-lg font-semibold text-gray-900">收款信息</h3>
            <p class="text-sm text-gray-500">记录每笔收款，并上传文档或图片作为佐证。</p>
        </div>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getPaymentStatusClass(order.payment_status)}">
            {getPaymentStatusText(order.payment_status)}
        </span>
    </div>

    {#if paymentError}
        <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {paymentError}</div>
    {/if}
    {#if paymentSuccess}
        <div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✅ {paymentSuccess}</div>
    {/if}

    <div class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">收款状态</div>
            <div class="text-base font-semibold text-gray-900">{getPaymentStatusText(order.payment_status)}</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">已收金额</div>
            <div class="text-base font-semibold text-gray-900">{order.currency || 'CNY'} {safeParseFloat(order.received_amount || '0').toFixed(2)}</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">未收金额</div>
            <div class="text-base font-semibold text-gray-900">{order.currency || 'CNY'} {safeParseFloat(order.balance_due || order.total_amount || '0').toFixed(2)}</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">收款进度</div>
            <div class="text-base font-semibold text-gray-900">{Math.round(order.payment_progress_percentage || 0)}%</div>
        </div>
    </div>

    <div class="mb-6">
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
                class="h-full rounded-full bg-green-500 transition-all"
                style={`width: ${Math.min(order.payment_progress_percentage || 0, 100)}%`}
            ></div>
        </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-date">收款日期</label>
                <input id="payment-date" type="date" bind:value={paymentForm.received_date} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-amount">收款金额</label>
                <input id="payment-amount" type="number" min="0" step="0.01" bind:value={paymentForm.amount} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="0.00" />
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-method">收款方式</label>
                <input id="payment-method" type="text" bind:value={paymentForm.payment_method} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="银行 / 现金 / PayPal" />
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-reference">流水号/凭证号</label>
                <input id="payment-reference" type="text" bind:value={paymentForm.reference_number} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="REF-001" />
            </div>
        </div>

        <div class="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-[2fr_1fr]">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-notes">备注</label>
                <textarea id="payment-notes" bind:value={paymentForm.notes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="可填写本次收款的补充说明"></textarea>
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-attachment">佐证文件</label>
                <input id="payment-attachment" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 hover:file:bg-blue-100" onchange={handlePaymentAttachmentChange} />
                <p class="mt-2 text-xs text-gray-500">每条记录支持上传一个文件，图片和常见办公文档均可。</p>
                {#if paymentForm.attachment}
                    <p class="mt-2 text-xs text-gray-700">📎 {paymentForm.attachment.name}</p>
                {/if}
            </div>
        </div>

        <div class="mt-4 flex justify-end">
            <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                onclick={createPaymentRecord}
                disabled={paymentSaving}
            >
                {#if paymentSaving}
                    保存中...
                {:else}
                    添加收款记录
                {/if}
            </button>
        </div>
    </div>

    <div class="space-y-4">
        {#if order.payment_records && order.payment_records.length > 0}
            {#each order.payment_records as record}
                <div class="rounded-xl border border-gray-200 p-4">
                    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div class="space-y-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="text-sm font-semibold text-gray-900">{record.received_date}</span>
                                <span class="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">{record.currency} {safeParseFloat(record.amount).toFixed(2)}</span>
                                {#if record.payment_method}
                                    <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{record.payment_method}</span>
                                {/if}
                                {#if record.reference_number}
                                    <span class="text-xs text-gray-500">凭证号： {record.reference_number}</span>
                                {/if}
                            </div>
                            {#if record.notes}
                                <p class="text-sm text-gray-600 whitespace-pre-wrap">{record.notes}</p>
                            {/if}
                            {#if record.attachment_url}
                                <div class="space-y-2">
                                    <a href={record.attachment_url} target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                        📎 {record.attachment_name || '查看附件'}
                                    </a>
                                    {#if record.attachment_is_image}
                                        <img src={record.attachment_url} alt={record.attachment_name || 'attachment'} class="max-h-40 rounded-lg border border-gray-200 object-contain" />
                                    {/if}
                                </div>
                            {/if}
                        </div>
                        <button
                            type="button"
                            class="self-start rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onclick={() => deletePaymentRecord(record.id)}
                            disabled={deletingPaymentId === record.id}
                        >
                            {#if deletingPaymentId === record.id}
                                删除中...
                            {:else}
                                删除
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                暂未添加收款记录。
            </div>
        {/if}
    </div>
</div>
