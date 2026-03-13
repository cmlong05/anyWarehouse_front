<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { salesOrderAPI } from '$lib/api';
    import type { SalesOrder } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { localeStore } from '$lib/i18n/sales';
    import { formatNumber } from '$lib/utils';

    let orderId = $derived(parseInt(page.params.id || '0'));
    let order = $state<SalesOrder | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // 可编辑的 PI 信息（纯前端）
    let piDate = $state('');
    let validUntil = $state('');
    let paymentTerms = $state('T/T 30% deposit, 70% before shipment');
    let deliveryTerms = $state('FOB Shenzhen');
    let notes = $state('');
    let companyName = $state('Your Company Name');
    let companyAddress = $state('');

    onMount(async () => {
        const today = new Date();
        piDate = today.toISOString().split('T')[0];
        const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
        validUntil = nextMonth.toISOString().split('T')[0];
        
        await loadOrder();
    });

    async function loadOrder() {
        loading = true;
        error = null;
        try {
            order = await salesOrderAPI.get(orderId);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
        }
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }

    function formatCurrency(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `USD ${num.toFixed(2)}`;
    }

    function printPI() {
        window.print();
    }

    function goBack() {
        goto(`/customer/sales-order/${orderId}`);
    }
</script>

<div class="min-h-screen bg-gray-100 p-4">
    {#if loading}
        <Loading />
    {:else if error}
        <Alert {error} onDismiss={() => error = null} />
        <div class="mt-4 text-center">
            <button class="px-4 py-2 bg-gray-500 text-white rounded-lg" onclick={goBack}>
                返回
            </button>
        </div>
    {:else if order}
        <!-- 工具栏 -->
        <div class="max-w-5xl mx-auto mb-4 flex justify-between items-center print:hidden">
            <div class="flex gap-2">
                <button class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600" onclick={goBack}>
                    ← 返回
                </button>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onclick={printPI}>
                    🖨️ 打印
                </button>
            </div>
        </div>

        <!-- 编辑区 -->
        <div class="max-w-5xl mx-auto mb-4 bg-white p-4 rounded-lg shadow print:hidden">
            <h3 class="font-semibold mb-3">PI 信息设置</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="companyName" class="block text-sm text-gray-600 mb-1">公司名称</label>
                    <input id="companyName" type="text" class="w-full px-3 py-2 border rounded" bind:value={companyName} />
                </div>
                <div>
                    <label for="companyAddress" class="block text-sm text-gray-600 mb-1">公司地址</label>
                    <input id="companyAddress" type="text" class="w-full px-3 py-2 border rounded" bind:value={companyAddress} />
                </div>
                <div>
                    <label for="piDate" class="block text-sm text-gray-600 mb-1">PI 日期</label>
                    <input id="piDate" type="date" class="w-full px-3 py-2 border rounded" bind:value={piDate} />
                </div>
                <div>
                    <label for="validUntil" class="block text-sm text-gray-600 mb-1">有效期至</label>
                    <input id="validUntil" type="date" class="w-full px-3 py-2 border rounded" bind:value={validUntil} />
                </div>
                <div class="col-span-2">
                    <label for="paymentTerms" class="block text-sm text-gray-600 mb-1">付款条款</label>
                    <input id="paymentTerms" type="text" class="w-full px-3 py-2 border rounded" bind:value={paymentTerms} />
                </div>
                <div class="col-span-2">
                    <label for="deliveryTerms" class="block text-sm text-gray-600 mb-1">交货条款</label>
                    <input id="deliveryTerms" type="text" class="w-full px-3 py-2 border rounded" bind:value={deliveryTerms} />
                </div>
                <div class="col-span-2">
                    <label for="notes" class="block text-sm text-gray-600 mb-1">备注</label>
                    <textarea id="notes" class="w-full px-3 py-2 border rounded" rows="2" bind:value={notes}></textarea>
                </div>
            </div>
        </div>

        <!-- PI 文档 -->
        <div class="max-w-5xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0 print:max-w-full print:m-0">
            <!-- 头部 -->
            <div class="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
                <div class="flex-1">
                    <h1 class="text-2xl font-bold">{companyName}</h1>
                    <p class="text-sm text-gray-600">{companyAddress}</p>
                </div>
                <div class="text-right">
                    <h2 class="text-3xl font-bold text-gray-800">PROFORMA INVOICE</h2>
                    <p class="text-lg mt-2">Ref: {order.order_number}</p>
                </div>
            </div>

            <!-- 信息区 -->
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
                        <span class="text-gray-600 text-left">Date:</span>
                        <span class="font-medium">{formatDate(piDate)}</span>
                        
                        <span class="text-gray-600 text-left">Valid Until:</span>
                        <span class="font-medium">{formatDate(validUntil)}</span>
                        
                        <span class="text-gray-600 text-left">SO No.:</span>
                        <span class="font-medium">{order.order_number}</span>
                        
                        <span class="text-gray-600 text-left">Currency:</span>
                        <span class="font-medium">USD</span>
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
                                {$localeStore === 'en' ? (item.item_name_en || item.item_name) : item.item_name}
                            </td>
                            <td class="py-2 px-3 text-sm text-right">{formatNumber(item.quantity)}</td>
                            <td class="py-2 px-3 text-sm text-right">PCS</td>
                            <td class="py-2 px-3 text-sm text-right">${parseFloat(item.unit_price).toFixed(2)}</td>
                            <td class="py-2 px-3 text-sm text-right">${parseFloat(item.line_total).toFixed(2)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            <!-- 汇总 -->
            <div class="flex justify-end mb-8">
                <div class="w-72">
                    <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="text-sm text-gray-600">Subtotal:</span>
                        <span class="text-sm">${parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    {#if parseFloat(order.tax_amount) > 0}
                        <div class="flex justify-between py-1 border-b border-gray-200">
                            <span class="text-sm text-gray-600">Tax ({order.tax_rate}%):</span>
                            <span class="text-sm">${parseFloat(order.tax_amount).toFixed(2)}</span>
                        </div>
                    {/if}
                    {#if parseFloat(order.shipping_cost) > 0}
                        <div class="flex justify-between py-1 border-b border-gray-200">
                            <span class="text-sm text-gray-600">Shipping:</span>
                            <span class="text-sm">${parseFloat(order.shipping_cost).toFixed(2)}</span>
                        </div>
                    {/if}
                    {#if parseFloat(order.discount) > 0}
                        <div class="flex justify-between py-1 border-b border-gray-200">
                            <span class="text-sm text-gray-600">Discount:</span>
                            <span class="text-sm">-${parseFloat(order.discount).toFixed(2)}</span>
                        </div>
                    {/if}
                    <div class="flex justify-between py-2 border-t-2 border-gray-800 mt-2">
                        <span class="font-bold">TOTAL:</span>
                        <span class="font-bold text-xl">{formatCurrency(order.total_amount)}</span>
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

            <!-- 签名 -->
            <div class="mt-16 pt-8 border-t border-gray-300">
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
            </div>
        </div>
    {/if}
</div>

<style>
    /* 隐藏浏览器打印的页眉页脚 */
    @page {
        margin: 0;
    }
    
    @media print {
        .print\:hidden {
            display: none !important;
        }
        
        /* 隐藏导航栏 */
        :global(nav),
        :global(.sticky) {
            display: none !important;
        }
        
        :global(body) {
            background: white !important;
            margin: 1cm;  /* 给页面内容留边距 */
        }
        
        .print\:shadow-none {
            box-shadow: none !important;
        }
        
        .print\:p-0 {
            padding: 0 !important;
        }
        
        .print\:max-w-full {
            max-width: 100% !important;
        }
        
        .print\:m-0 {
            margin: 0 !important;
        }
    }
</style>
