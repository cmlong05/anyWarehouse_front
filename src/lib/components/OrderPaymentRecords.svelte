<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { purchaseOrderPaymentRecordAPI, purchaseOrderAPI } from '$lib/api';
  import Loading from '$lib/components/Loading.svelte';
  import { safeParseFloat } from '$lib/utils';

  interface Props {
    orderId: number;
    currency?: string;
  }

  let { orderId, currency = 'CNY' }: Props = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let records = $state<any[]>([]);
  let submitting = $state(false);
  let editingId = $state<number | null>(null);
  let deletingId = $state<number | null>(null);

  let order = $state<any | null>(null);
  let displayCurrency = $derived(order?.currency || currency);

  function getTodayLocalDate(): string {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  let form = $state({
    received_date: getTodayLocalDate(),
    amount: '',
    payment_method: '',
    reference_number: '',
    notes: '',
    attachment: null as File | null,
  });

  function resetForm() {
    form = {
      received_date: getTodayLocalDate(),
      amount: '',
      payment_method: '',
      reference_number: '',
      notes: '',
      attachment: null,
    };
    editingId = null;
  }

  function getPaymentStatusText(status: string | undefined): string {
    if (status === 'paid') return '已付款';
    if (status === 'partial') return '部分付款';
    return '未付款';
  }

  function getPaymentStatusClass(status: string | undefined): string {
    if (status === 'paid') return 'bg-green-100 text-green-700';
    if (status === 'partial') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  }

  function handleAttachmentChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    form.attachment = target.files?.[0] ?? null;
  }

  async function reload() {
    const [orderRes, res] = await Promise.all([
      purchaseOrderAPI.get(orderId),
      purchaseOrderPaymentRecordAPI.listByOrder(orderId),
    ]);
    order = orderRes;
    records = Array.isArray(res) ? res : (res as any).results ?? [];
  }

  async function load() {
    if (!orderId) return;
    loading = true;
    error = null;
    try {
      await reload();
    } catch (e) {
      console.error(e);
      error = '加载付款记录失败';
    } finally {
      loading = false;
    }
  }

  function openEdit(record: any) {
    editingId = record.id;
    form = {
      received_date: record.received_date || getTodayLocalDate(),
      amount: String(record.amount || ''),
      payment_method: record.payment_method || '',
      reference_number: record.reference_number || '',
      notes: record.notes || '',
      attachment: null,
    };
    if (browser) window.scrollTo({ top: document.getElementById('payment-form-section')?.offsetTop ?? 0, behavior: 'smooth' });
  }

  async function submit() {
    if (!orderId) return;
    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      error = '请输入有效的付款金额';
      return;
    }
    submitting = true;
    error = null;
    success = null;
    try {
      const payload = {
        purchase_order: orderId,
        received_date: form.received_date,
        amount: parsedAmount,
        currency: displayCurrency || 'CNY',
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        notes: form.notes,
        ...(form.attachment ? { attachment: form.attachment } : {}),
      };

      if (editingId) {
        await purchaseOrderPaymentRecordAPI.patch(editingId, payload);
        success = '付款记录已更新。';
      } else {
        await purchaseOrderPaymentRecordAPI.create(payload);
        success = '付款记录已添加。';
      }
      resetForm();
      await reload();
    } catch (e) {
      console.error(e);
      error = e instanceof Error ? e.message : '提交付款记录失败';
    } finally {
      submitting = false;
    }
  }

  async function removeRecord(id: number) {
    if (deletingId) return;
    deletingId = id;
    error = null;
    success = null;
    try {
      await purchaseOrderPaymentRecordAPI.delete(id);
      success = '付款记录已删除。';
      await reload();
    } catch (e) {
      console.error(e);
      error = '删除失败';
    } finally {
      deletingId = null;
    }
  }

  onMount(() => load());
</script>

<div class="bg-white rounded-lg p-6 shadow mb-6">
  <div class="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">付款信息</h3>
      <p class="text-sm text-gray-500">记录每笔付款，并上传文档或图片作为佐证。</p>
    </div>
    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getPaymentStatusClass(order?.payment_status)}">
      {getPaymentStatusText(order?.payment_status)}
    </span>
  </div>

  {#if loading}
    <Loading />
  {:else}
    {#if error}
      <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>
    {/if}
    {#if success}
      <div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✅ {success}</div>
    {/if}

    <div class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="text-xs text-gray-500 mb-1">付款状态</div>
        <div class="text-base font-semibold text-gray-900">{getPaymentStatusText(order?.payment_status)}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="text-xs text-gray-500 mb-1">已付金额</div>
        <div class="text-base font-semibold text-gray-900">{order?.currency || displayCurrency} {safeParseFloat(order?.received_amount || '0').toFixed(2)}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="text-xs text-gray-500 mb-1">未付金额</div>
        <div class="text-base font-semibold text-gray-900">{order?.currency || displayCurrency} {safeParseFloat(order?.balance_due || order?.total_amount || '0').toFixed(2)}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="text-xs text-gray-500 mb-1">付款进度</div>
        <div class="text-base font-semibold text-gray-900">{Math.round(order?.payment_progress_percentage || 0)}%</div>
      </div>
    </div>

    <div class="mb-6">
      <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          class="h-full rounded-full bg-green-500 transition-all"
          style={`width: ${Math.min(order?.payment_progress_percentage || 0, 100)}%`}
        ></div>
      </div>
    </div>

    <div id="payment-form-section" class="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
      {#if editingId}
        <p class="text-sm font-medium text-amber-700 mb-3">正在编辑付款记录 #{editingId}</p>
      {/if}
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-date">付款日期</label>
          <input id="payment-date" type="date" bind:value={form.received_date} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-amount">付款金额</label>
          <input id="payment-amount" type="number" min="0" step="0.01" bind:value={form.amount} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="0.00" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-method">付款方式</label>
          <input id="payment-method" type="text" bind:value={form.payment_method} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="银行 / 现金 / PayPal" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-reference">流水号/凭证号</label>
          <input id="payment-reference" type="text" bind:value={form.reference_number} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="REF-001" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-notes">备注</label>
          <textarea id="payment-notes" bind:value={form.notes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="可填写本次付款的补充说明"></textarea>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-attachment">佐证文件</label>
          <input id="payment-attachment" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 hover:file:bg-blue-100" onchange={handleAttachmentChange} />
          <p class="mt-2 text-xs text-gray-500">每条记录支持上传一个文件，图片和常见办公文档均可。</p>
          {#if form.attachment}
            <p class="mt-2 text-xs text-gray-700">📎 {form.attachment.name}</p>
          {/if}
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        {#if editingId}
          <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onclick={resetForm} disabled={submitting}>
            取消编辑
          </button>
        {/if}
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onclick={submit}
          disabled={submitting}
        >
          {#if submitting}
            保存中...
          {:else}
            {editingId ? '保存修改' : '添加付款记录'}
          {/if}
        </button>
      </div>
    </div>

    <div class="space-y-4">
      {#if records.length > 0}
        {#each records as record}
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
              <div class="flex gap-2 self-start">
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  onclick={() => openEdit(record)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onclick={() => removeRecord(record.id)}
                  disabled={deletingId === record.id}
                >
                  {deletingId === record.id ? '删除中...' : '删除'}
                </button>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          暂未添加付款记录。
        </div>
      {/if}
    </div>
  {/if}
</div>
