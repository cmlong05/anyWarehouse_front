<script lang="ts">
    import { superForm } from 'sveltekit-superforms';
    import { zod4Client } from 'sveltekit-superforms/adapters';
    import { BaseModal } from '$lib/components/modal';
    import { FormInput, FormSelect } from '$lib/components/ui';
    import {
        purchaseOrderAPI,
        purchaseOrderPaymentRecordAPI,
        salesOrderAPI,
        salesOrderPaymentRecordAPI
    } from '$lib/api';
    import type {
        PurchaseOrderBrief,
        PurchaseOrderPaymentRecord,
        SalesOrderBrief,
        SalesOrderPaymentRecord
    } from '$lib';
    import {
        getPaymentAmountError,
        type PaymentManagementMode
    } from '$lib/payment/management';
    import { paymentRecordFormSchema } from '$lib/schemas';
    import type { ModalCloseReason } from '$lib/modal/types';

    type PaymentRecord = SalesOrderPaymentRecord | PurchaseOrderPaymentRecord;
    type OrderOption = {
        id: number;
        order_number: string;
        currency: string;
    };
    type PartnerOption = {
        id: number;
        name: string;
        code?: string;
    };

    interface Props {
        open: boolean;
        mode: PaymentManagementMode;
        record?: PaymentRecord | null;
        partners: PartnerOption[];
        initialPartnerId?: string;
        onClose: () => void;
        onSaved: () => Promise<void>;
    }

    let {
        open,
        mode,
        record = null,
        partners,
        initialPartnerId = '',
        onClose,
        onSaved
    }: Props = $props();

    const copy = $derived(
        mode === 'receivable'
            ? {
                  noun: '收款',
                  partnerLabel: '客户',
                  partnerPlaceholder: '请选择客户',
                  orderLabel: '销售订单',
                  orderPlaceholder: '请选择销售订单'
              }
            : {
                  noun: '付款',
                  partnerLabel: '供应商',
                  partnerPlaceholder: '请选择供应商',
                  orderLabel: '采购订单',
                  orderPlaceholder: '请选择采购订单'
              }
    );

    function getTodayLocalDate(): string {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);
    }

    function getRecordOrderId(record: PaymentRecord | null): number | null {
        if (!record) return null;
        return 'sales_order' in record ? record.sales_order : record.purchase_order;
    }

    function getRecordPartnerId(record: PaymentRecord | null): string {
        if (!record) return initialPartnerId;
        return String(
            'customer_id' in record ? record.customer_id : record.supplier_id
        );
    }

    function createInitialForm() {
        return {
            partnerId: getRecordPartnerId(record),
            orderId: getRecordOrderId(record)?.toString() ?? '',
            receivedDate: record?.received_date ?? getTodayLocalDate(),
            amount: record?.amount ?? '',
            paymentMethod: record?.payment_method ?? '',
            referenceNumber: record?.reference_number ?? '',
            notes: record?.notes ?? ''
        };
    }

    const { form, errors, reset, validateForm } = superForm(createInitialForm(), {
        validators: zod4Client(paymentRecordFormSchema),
        dataType: 'json',
        resetForm: false
    });

    let orders = $state<OrderOption[]>([]);
    let loadingOrders = $state(false);
    let saving = $state(false);
    let submitError = $state('');
    let amountError = $state('');
    let attachment = $state<File | null>(null);

    const partnerOptions = $derived.by(() => {
        const options = partners.map((partner) => ({
            value: String(partner.id),
            label: partner.code ? `${partner.code} · ${partner.name}` : partner.name
        }));
        if (record && !partners.some((partner) => partner.id === Number(getRecordPartnerId(record)))) {
            options.unshift({
                value: getRecordPartnerId(record),
                label:
                    'customer_name' in record
                        ? record.customer_name
                        : record.supplier_name
            });
        }
        return options;
    });

    const orderOptions = $derived(
        orders.map((order) => ({
            value: String(order.id),
            label: `${order.order_number} · ${order.currency}`
        }))
    );

    function setField<K extends keyof ReturnType<typeof createInitialForm>>(
        key: K,
        value: ReturnType<typeof createInitialForm>[K]
    ) {
        form.update((current) => ({ ...current, [key]: value }));
    }

    function getRecordOrderOption(): OrderOption | null {
        if (!record) return null;
        const orderId = getRecordOrderId(record);
        if (!orderId) return null;
        return {
            id: orderId,
            order_number: record.order_number,
            currency: record.currency
        };
    }

    async function loadOrders(partnerId: string) {
        if (!partnerId) {
            orders = [];
            return;
        }

        loadingOrders = true;
        try {
            let result: PurchaseOrderBrief[] | SalesOrderBrief[];
            if (mode === 'receivable') {
                const response = await salesOrderAPI.listBrief({
                    customer_id: Number(partnerId),
                    page_size: 100
                });
                result = response.results;
            } else {
                const response = await purchaseOrderAPI.listBrief({
                    supplier_id: Number(partnerId),
                    page_size: 100
                });
                result = response.results;
            }

            orders = result.map((order) => ({
                id: order.id,
                order_number: order.order_number,
                currency: order.currency || 'CNY'
            }));

            const recordOrder = getRecordOrderOption();
            if (
                recordOrder &&
                getRecordPartnerId(record) === partnerId &&
                !orders.some((order) => order.id === recordOrder.id)
            ) {
                orders = [recordOrder, ...orders];
            }
        } catch (error) {
            submitError =
                error instanceof Error ? error.message : `${copy.orderLabel}加载失败`;
            orders = [];
        } finally {
            loadingOrders = false;
        }
    }

    async function handlePartnerChange(partnerId: string) {
        submitError = '';
        form.update((current) => ({
            ...current,
            partnerId,
            orderId: ''
        }));
        await loadOrders(partnerId);
    }

    function handleAttachmentChange(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        attachment = target.files?.[0] ?? null;
    }

    async function save() {
        if (saving || loadingOrders) return;

        submitError = '';
        amountError = '';

        const validation = await validateForm({ update: true });
        if (!validation.valid) return;

        const amount = Number($form.amount);
        const amountValidationError = getPaymentAmountError(mode, amount);
        if (amountValidationError) {
            amountError = amountValidationError;
            return;
        }

        const orderId = Number($form.orderId);
        const selectedOrder = orders.find((order) => order.id === orderId);
        const currency = selectedOrder?.currency || record?.currency || 'CNY';
        const commonPayload = {
            received_date: $form.receivedDate,
            amount,
            currency,
            payment_method: $form.paymentMethod.trim(),
            reference_number: $form.referenceNumber.trim(),
            notes: $form.notes.trim(),
            ...(attachment ? { attachment } : {})
        };

        saving = true;
        try {
            if (mode === 'receivable') {
                const payload = {
                    sales_order: orderId,
                    ...commonPayload
                };
                if (record) {
                    await salesOrderPaymentRecordAPI.patch(record.id, payload);
                } else {
                    await salesOrderPaymentRecordAPI.create(payload);
                }
            } else {
                const payload = {
                    purchase_order: orderId,
                    ...commonPayload
                };
                if (record) {
                    await purchaseOrderPaymentRecordAPI.patch(record.id, payload);
                } else {
                    await purchaseOrderPaymentRecordAPI.create(payload);
                }
            }
            await onSaved();
            onClose();
        } catch (error) {
            submitError =
                error instanceof Error ? error.message : `保存${copy.noun}记录失败`;
        } finally {
            saving = false;
        }
    }

    $effect(() => {
        if (!open) return;
        const initialForm = createInitialForm();
        reset({ data: initialForm, keepMessage: true });
        attachment = null;
        submitError = '';
        amountError = '';
        void loadOrders(initialForm.partnerId);
    });

    function handleClose(reason: ModalCloseReason) {
        if (!saving) onClose();
    }
</script>

<BaseModal
    {open}
    title={`${record ? '编辑' : '新增'}${copy.noun}记录`}
    description={`记录${copy.partnerLabel}订单的一笔${copy.noun}，保存后订单状态会自动重算。`}
    size="lg"
    busy={saving}
    onClose={handleClose}
>
    <form
        class="space-y-5 px-6 py-5"
        onsubmit={(event) => {
            event.preventDefault();
            void save();
        }}
    >
        {#if submitError}
            <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
            </div>
        {/if}

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
                label={copy.partnerLabel}
                name="payment-partner"
                required
                value={$form.partnerId}
                options={partnerOptions}
                placeholder={copy.partnerPlaceholder}
                error={$errors.partnerId?.[0]}
                onchange={(value) => void handlePartnerChange(value)}
            />
            <FormSelect
                label={copy.orderLabel}
                name="payment-order"
                required
                value={$form.orderId}
                options={orderOptions}
                placeholder={loadingOrders ? '正在加载订单...' : copy.orderPlaceholder}
                disabled={loadingOrders || !$form.partnerId}
                error={$errors.orderId?.[0]}
                onchange={(value) => setField('orderId', value)}
            />
            <FormInput
                label={`${copy.noun}日期`}
                name="payment-date"
                type="date"
                required
                value={$form.receivedDate}
                error={$errors.receivedDate?.[0]}
                oninput={(value) => setField('receivedDate', value)}
            />
            <FormInput
                label={`${copy.noun}金额`}
                name="payment-amount"
                type="number"
                required
                value={$form.amount}
                step={0.01}
                min={mode === 'payable' ? 0.01 : undefined}
                placeholder={mode === 'receivable' ? '支持负数退款' : '0.00'}
                error={amountError || $errors.amount?.[0]}
                oninput={(value) => {
                    amountError = '';
                    setField('amount', value);
                }}
            />
            <FormInput
                label={`${copy.noun}方式`}
                name="payment-method"
                value={$form.paymentMethod}
                placeholder="银行 / 现金 / PayPal"
                error={$errors.paymentMethod?.[0]}
                oninput={(value) => setField('paymentMethod', value)}
            />
            <FormInput
                label="流水号/凭证号"
                name="payment-reference"
                value={$form.referenceNumber}
                placeholder="REF-001"
                error={$errors.referenceNumber?.[0]}
                oninput={(value) => setField('referenceNumber', value)}
            />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <label
                    class="mb-1 block text-sm font-medium text-gray-700"
                    for="payment-notes"
                >
                    备注
                </label>
                <textarea
                    id="payment-notes"
                    rows="4"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={$form.notes}
                    oninput={(event) =>
                        setField('notes', (event.currentTarget as HTMLTextAreaElement).value)}
                    placeholder={`填写本次${copy.noun}的补充说明`}
                ></textarea>
                {#if $errors.notes?.[0]}
                    <p class="mt-1 text-xs text-red-600">{$errors.notes[0]}</p>
                {/if}
            </div>
            <div>
                <label
                    class="mb-1 block text-sm font-medium text-gray-700"
                    for="payment-attachment"
                >
                    凭证文件
                </label>
                <input
                    id="payment-attachment"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 hover:file:bg-blue-100"
                    onchange={handleAttachmentChange}
                />
                <p class="mt-2 text-xs text-gray-500">
                    每条记录支持一个文件；编辑时不上传新文件会保留原附件。
                </p>
                {#if attachment}
                    <p class="mt-2 truncate text-xs text-gray-700">📎 {attachment.name}</p>
                {:else if record?.attachment_name}
                    <p class="mt-2 truncate text-xs text-gray-500">
                        当前附件：{record.attachment_name}
                    </p>
                {/if}
            </div>
        </div>
    </form>

    {#snippet footer()}
        <div class="flex justify-end gap-3 px-6 py-4">
            <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={onClose}
                disabled={saving}
            >
                取消
            </button>
            <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={() => void save()}
                disabled={saving || loadingOrders}
            >
                {saving ? '保存中...' : '保存'}
            </button>
        </div>
    {/snippet}
</BaseModal>
