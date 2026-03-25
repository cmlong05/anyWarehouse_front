<!--
  共享打印文档组件，供 PI 和 Invoice 复用。
  调用方负责数据加载，此组件只负责渲染。

  Props:
    order                - SalesOrder 对象
    companyName          - 公司名称
    companyAddress       - 公司地址
    paymentTerms         - 付款条款
    deliveryTerms        - 交货条款
    notes                - 备注
    title                - 文档标题（如 "PROFORMA INVOICE" | "INVOICE"）
    metaRows             - 右侧信息格 [{label, value}]
    showCustomerSignature - 是否显示客户签名栏（PI 需要；Invoice 不需要）
    locale               - 'zh' | 'en'，控制商品名显示语言
-->
<script lang="ts">
    import type { SalesOrder } from '$lib';
    import { formatCurrencyAmount, formatNumber } from '$lib/utils';

    interface MetaRow {
        label: string;
        value: string;
    }

    interface Props {
        order: SalesOrder;
        companyName: string;
        companyAddress: string;
        paymentTerms: string;
        deliveryTerms: string;
        notes: string;
        title: string;
        metaRows: MetaRow[];
        showCustomerSignature?: boolean;
        locale?: string;
        downloading?: boolean;
        /** 文档主体的 DOM id，默认 'print-document' */
        elementId?: string;
        /** 是否显示工具栏（返回/打印/下载），离屏渲染时设为 false */
        showToolbar?: boolean;
        onBack?: () => void;
        onPrint?: () => void;
        onDownload?: () => void;
    }

    let {
        order,
        companyName,
        companyAddress,
        paymentTerms,
        deliveryTerms,
        notes,
        title,
        metaRows,
        showCustomerSignature = false,
        locale = 'zh',
        downloading = false,
        elementId = 'print-document',
        showToolbar = true,
        onBack,
        onPrint,
        onDownload,
    }: Props = $props();

    const currency = $derived(order.currency || 'CNY');

    function fmt(amount: string | number): string {
        return formatCurrencyAmount(amount, currency);
    }
</script>

{#if showToolbar}
<!-- 工具栏（打印时隐藏） -->
<div class="max-w-5xl mx-auto mb-4 flex justify-between items-center print:hidden">
    <div class="flex gap-2">
        <button class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600" onclick={onBack}>
            ← 返回
        </button>
        <a href="/settings/pi" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ⚙️ 默认设置
        </a>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onclick={onPrint}>
            🖨️ 打印
        </button>
        <button
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onclick={onDownload}
            disabled={downloading}
        >
            {#if downloading}
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                生成中...
            {:else}
                ⬇️ 下载 PDF
            {/if}
        </button>
    </div>
</div>
{/if}

<!-- 文档主体 -->
<div id={elementId} class="max-w-5xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0 print:max-w-full print:m-0">
    <!-- 头部：公司信息 + 文档标题 -->
    <div class="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
        <div class="flex-1">
            <h1 class="text-2xl font-bold">{companyName}</h1>
            <p class="text-sm text-gray-600">{companyAddress}</p>
        </div>
        <div class="text-right">
            <h2 class="text-3xl font-bold text-gray-800">{title}</h2>
            <p class="text-lg mt-2">Ref: {order.order_number}</p>
        </div>
    </div>

    <!-- 信息区：收件方 + 右侧元数据 -->
    <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
            <h3 class="font-semibold text-gray-700 mb-2">To:</h3>
            <p class="font-medium">{order.customer_detail?.name || '-'}</p>
            {#if order.shipping_address}
                <p class="text-sm text-gray-600 mt-1">{order.shipping_address}</p>
            {/if}
            {#if order.contact_person}
                <p class="text-sm text-gray-600">Attn: {order.contact_person}</p>
            {/if}
            {#if order.contact_phone}
                <p class="text-sm text-gray-600">Tel: {order.contact_phone}</p>
            {/if}
        </div>
        <div class="text-right">
            <div class="grid grid-cols-2 gap-2 text-sm">
                {#each metaRows as row}
                    <span class="text-gray-600 text-left">{row.label}</span>
                    <span class="font-medium">{row.value}</span>
                {/each}
                <span class="text-gray-600 text-left">Currency:</span>
                <span class="font-medium">{currency}</span>
            </div>
        </div>
    </div>

    <!-- 明细表 -->
    <table class="w-full border-collapse mb-8">
        <thead>
            <tr class="bg-gray-100 border-b-2 border-gray-800">
                <th class="py-2 px-3 text-left text-sm">#</th>
                <th class="py-2 px-3 text-left text-sm">SKU</th>
                <th class="py-2 px-3 text-left text-sm">Description</th>
                <th class="py-2 px-3 text-right text-sm">Qty</th>
                <th class="py-2 px-3 text-right text-sm">Unit</th>
                <th class="py-2 px-3 text-right text-sm">Unit Price</th>
                <th class="py-2 px-3 text-right text-sm">Amount</th>
            </tr>
        </thead>
        <tbody>
            {#each order.items || [] as item}
                <tr class="border-b border-gray-200">
                    <td class="py-2 px-3 text-sm">{item.line_number}</td>
                    <td class="py-2 px-3 text-sm font-mono">{item.sku}</td>
                    <td class="py-2 px-3 text-sm">
                        {locale === 'en' ? (item.item_name_en || item.item_name) : item.item_name}
                    </td>
                    <td class="py-2 px-3 text-sm text-right">{formatNumber(item.quantity)}</td>
                    <td class="py-2 px-3 text-sm text-right">PCS</td>
                    <td class="py-2 px-3 text-sm text-right">{fmt(item.unit_price)}</td>
                    <td class="py-2 px-3 text-sm text-right">{fmt(item.line_total)}</td>
                </tr>
            {/each}
        </tbody>
    </table>

    <!-- 金额汇总 -->
    <div class="flex justify-end mb-8">
        <div class="w-72">
            <div class="flex justify-between py-1 border-b border-gray-200">
                <span class="text-sm text-gray-600">Subtotal:</span>
                <span class="text-sm">{fmt(order.subtotal)}</span>
            </div>
            {#if parseFloat(order.tax_amount) > 0}
                <div class="flex justify-between py-1 border-b border-gray-200">
                    <span class="text-sm text-gray-600">Tax ({order.tax_rate}%):</span>
                    <span class="text-sm">{fmt(order.tax_amount)}</span>
                </div>
            {/if}
            {#if parseFloat(order.shipping_cost) > 0}
                <div class="flex justify-between py-1 border-b border-gray-200">
                    <span class="text-sm text-gray-600">Shipping:</span>
                    <span class="text-sm">{fmt(order.shipping_cost)}</span>
                </div>
            {/if}
            {#if parseFloat(order.payment_fee) > 0}
                <div class="flex justify-between py-1 border-b border-gray-200">
                    <span class="text-sm text-gray-600">Payment Fee:</span>
                    <span class="text-sm">{fmt(order.payment_fee)}</span>
                </div>
            {/if}
            {#if parseFloat(order.discount) > 0}
                <div class="flex justify-between py-1 border-b border-gray-200">
                    <span class="text-sm text-gray-600">Discount:</span>
                    <span class="text-sm">-{fmt(order.discount)}</span>
                </div>
            {/if}
            <div class="flex justify-between py-2 border-t-2 border-gray-800 mt-2">
                <span class="font-bold">TOTAL:</span>
                <span class="font-bold text-xl">{fmt(order.total_amount)}</span>
            </div>
        </div>
    </div>

    <!-- 条款 -->
    <div class="space-y-4 text-sm">
        <div>
            <h4 class="font-semibold text-gray-700 mb-1">Payment Terms:</h4>
            <p class="text-gray-600">{paymentTerms}</p>
        </div>
        <div>
            <h4 class="font-semibold text-gray-700 mb-1">Delivery Terms:</h4>
            <p class="text-gray-600">{deliveryTerms}</p>
        </div>
        {#if notes}
            <div>
                <h4 class="font-semibold text-gray-700 mb-1">Notes:</h4>
                <p class="text-gray-600 whitespace-pre-line">{notes}</p>
            </div>
        {/if}
    </div>

    <!-- 签名区 -->
    <div class="mt-16 pt-8 border-t border-gray-300">
        {#if showCustomerSignature}
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <p class="text-sm text-gray-600 mb-8">Authorized Signature:</p>
                    <div class="border-b border-gray-400 h-8"></div>
                </div>
                <div>
                    <p class="text-sm text-gray-600 mb-8">Customer Acceptance:</p>
                    <div class="border-b border-gray-400 h-8"></div>
                </div>
            </div>
        {:else}
            <div class="flex justify-end">
                <div class="w-64">
                    <p class="text-sm text-gray-600 mb-8">Authorized Signature:</p>
                    <div class="border-b border-gray-400 h-8"></div>
                </div>
            </div>
        {/if}
    </div>
</div>
