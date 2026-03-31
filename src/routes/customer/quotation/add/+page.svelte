<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerQuotationAPI, customerAPI, itemAPI } from '$lib/api';
    import type { CustomerBrief, Item, CustomerQuotationCreateRequest } from '$lib';
    import type { ItemVariant } from '$lib/types/variant';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import { NumberStepper } from '$lib/components/ui';
    
    // 从URL获取预设的客户ID和物品IDs
    const presetCustomerId = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const customerId = urlParams.get('customer_id');
        return customerId ? parseInt(customerId) : null;
    });
    
    // 从URL获取预设的物品IDs（多个物品用逗号分隔）
    const presetItemIds = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const itemIds = urlParams.get('item_ids');
        if (!itemIds) return [];
        return itemIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    });
    
    let customers = $state<CustomerBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    // 选中的客户
    let selectedCustomer = $state<number | null>(null);
    
    // 当前客户的货币（从 customers 列表中读取）
    const customerCurrency = $derived(
        customers.find(c => c.id === selectedCustomer)?.currency || 'USD'
    );
    
    // 报价行数据
    interface QuotationLine {
        id: number;
        item: number | null;
        price: string;
        currency: string;
        min_quantity: number;
        lead_time_days: number | null;
        note: string;
        itemDetail?: Item | null;
        isVariantChild?: boolean;
        parentLineId?: number;
        variantInfo?: ItemVariant;
    }
    
    let quotationLines = $state<QuotationLine[]>([]);
    
    // 客户选项
    const customerOptions = $derived(customers.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`
    })));
    
    // 构建物品搜索 URL
    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);
    
    // 本地行ID计数器
    let lineIdCounter = 0;
    
    // 创建新的报价行（货币从客户读取）
    function createEmptyLine(parentId?: number): QuotationLine {
        return {
            id: ++lineIdCounter,
            item: null,
            price: '',
            currency: customerCurrency,
            min_quantity: 1,
            lead_time_days: null,
            note: '',
            itemDetail: null,
            isVariantChild: !!parentId,
            parentLineId: parentId,
        };
    }
    
    // 获取物品的变体列表
    async function fetchItemVariants(itemId: number): Promise<ItemVariant[]> {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/${itemId}/variants/`);
            if (response.ok) {
                const data = await response.json();
                return data.variants || [];
            }
        } catch (err) {
            // 获取变体列表失败
        }
        return [];
    }
    
    // 检查是否为变体母版
    function isVariantTemplate(item: Item): boolean {
        const val = (item as unknown as Record<string, unknown>).is_variant_template;
        if (val === true) return true;
        if (typeof val === 'string' && val.toLowerCase() === 'true') return true;
        if (val === 1 || val === '1') return true;
        return false;
    }
    
    // 处理 fetch 返回的数据
    function handleItemFetch(json: unknown) {
        const items = Array.isArray(json) ? json : ((json as { results?: Item[] })?.results || []);
        return items.map((item: Item) => ({
            value: item.id,
            label: `${item.SKU} - ${item.name}`
        }));
    }
    
    // 处理 Svelecte 选择变化
    function handleSelectChange(line: QuotationLine, selectedValue: unknown) {
        // Svelecte 可能返回对象，需要提取 value
        let selectedId: number | null = null;
        
        if (typeof selectedValue === 'number') {
            selectedId = selectedValue;
        } else if (typeof selectedValue === 'string') {
            selectedId = parseInt(selectedValue, 10);
        } else if (selectedValue && typeof selectedValue === 'object') {
            // 尝试从对象中提取 value
            const val = (selectedValue as Record<string, unknown>).value;
            if (typeof val === 'number') {
                selectedId = val;
            } else if (typeof val === 'string') {
                selectedId = parseInt(val, 10);
            }
        }
        
        handleItemSelect(line, selectedId);
    }
    
    // 处理物品选择 - 选择物品时自动添加新行或展开变体
    async function handleItemSelect(line: QuotationLine, selectedItemId: number | null) {
        // 确保 ID 是数字
        const itemId = typeof selectedItemId === 'number' ? selectedItemId : 
                      typeof selectedItemId === 'string' ? parseInt(selectedItemId, 10) : null;
        
        if (!itemId || isNaN(itemId)) {
            line.item = null;
            line.itemDetail = null;
            return;
        }
        
        // 检查是否已存在相同的物品（不包括变体子项）
        const duplicateLine = quotationLines.find(l => 
            l.id !== line.id && 
            !l.isVariantChild && 
            l.item === itemId
        );
        if (duplicateLine) {
            error = `物品已在第 ${quotationLines.indexOf(duplicateLine) + 1} 行添加，请勿重复添加`;
            setTimeout(() => error = '', 3000);
            // 清空选择
            line.item = null;
            return;
        }
        
        // 更新当前行
        const lineIndex = quotationLines.findIndex(l => l.id === line.id);
        if (lineIndex === -1) return;
        
        // 加载物品详情
        try {
            const itemResponse = await itemAPI.get(itemId);
            // unwrap wrapper object if present
            const item = (itemResponse as any).item || itemResponse;
            
            // 创建更新后的行
            const updatedLine = {
                ...line,
                item: itemId,
                itemDetail: item,
            };
            
            // 更新数组
            quotationLines[lineIndex] = updatedLine;
            quotationLines = [...quotationLines]; // 触发响应式更新
            
            // 如果是变体母版，展开所有子变体
            if (isVariantTemplate(item)) {
                const variants = await fetchItemVariants(itemId);
                if (variants.length > 0) {
                    const variantLines: QuotationLine[] = variants.map(variant => ({
                        id: ++lineIdCounter,
                        item: variant.variant_item,
                        price: '',
                        currency: customerCurrency,
                        min_quantity: 1,
                        lead_time_days: null,
                        note: '',
                        itemDetail: variant.variant_item_detail as unknown as Item,
                        isVariantChild: true,
                        parentLineId: line.id,
                        variantInfo: variant,
                    }));
                    
                    // 插入变体行到当前行后面
                    const newLines = [
                        ...quotationLines.slice(0, lineIndex + 1),
                        ...variantLines,
                        ...quotationLines.slice(lineIndex + 1)
                    ];
                    quotationLines = newLines;
                }
            }
            
            // 如果是最后一行且已选择了物品，自动添加新行
            const lastLine = quotationLines[quotationLines.length - 1];
            if (lastLine && lastLine.id === line.id && updatedLine.item) {
                addLine();
            }
        } catch (err) {
            line.itemDetail = null;
        }
    }
    
    // 添加新行
    function addLine() {
        quotationLines = [...quotationLines, createEmptyLine()];
    }
    
    // 删除行（如果是母版，同时删除其所有变体子行）
    function removeLine(lineId: number) {
        const lineToRemove = quotationLines.find(l => l.id === lineId);
        if (!lineToRemove) return;
        
        if (quotationLines.length <= 1) {
            // 至少保留一行
            quotationLines = [createEmptyLine()];
            // 清空所有选择
            return;
        }
        
        // 如果是母版行，同时删除其所有变体子行
        if (!lineToRemove.isVariantChild) {
            quotationLines = quotationLines.filter(l => l.id !== lineId && l.parentLineId !== lineId);
        } else {
            quotationLines = quotationLines.filter(l => l.id !== lineId);
        }
        
        // 清理完成
    }
    
    // 加载初始数据
    async function loadInitialData() {
        try {
            customers = await customerAPI.listBrief();
            
            const customerId = presetCustomerId();
            if (customerId) {
                selectedCustomer = customerId;
            }
            
            // 检查是否有预设的物品IDs
            const itemIds = presetItemIds();
            if (itemIds.length > 0) {
                // 加载预设的物品
                for (const itemId of itemIds) {
                    try {
                        const itemResponse = await itemAPI.get(itemId);
                        // API 可能返回 {item: {...}} 或直接的 item 对象
                        const item = (itemResponse as unknown as { item?: Item }).item || itemResponse as Item;
                        const line = createEmptyLine();
                        line.item = itemId;
                        line.itemDetail = item;
                        quotationLines = [...quotationLines, line];
                        
                        // 如果是变体母版，展开所有子变体
                        if (isVariantTemplate(item)) {
                            const variants = await fetchItemVariants(itemId);
                            if (variants.length > 0) {
                                const variantLines: QuotationLine[] = variants.map(variant => ({
                                    id: ++lineIdCounter,
                                    item: variant.variant_item,
                                    price: '',
                                    currency: customerCurrency,
                                    min_quantity: 1,
                                    lead_time_days: null,
                                    note: '',
                                    itemDetail: variant.variant_item_detail as unknown as Item,
                                    isVariantChild: true,
                                    parentLineId: line.id,
                                    variantInfo: variant,
                                }));
                                quotationLines = [...quotationLines, ...variantLines];
                            }
                        }
                    } catch (e) {
                        // 加载单个物品失败，跳过
                    }
                }
            }
            
            // 如果没有物品，默认添加一行
            if (quotationLines.length === 0) {
                addLine();
            }
        } catch (err) {
            error = '加载数据失败';
        }
    }
    
    // 验证表单
    function validateForm(): boolean {
        if (!selectedCustomer) {
            error = '请选择客户';
            return false;
        }
        
        // 过滤掉空行（没有选物品的）
        const validLines = quotationLines.filter(l => l.item !== null);
        
        if (validLines.length === 0) {
            error = '请至少添加一个物品的报价';
            return false;
        }
        
        // 验证每一行
        for (let i = 0; i < validLines.length; i++) {
            const line = validLines[i];
            const rowNum = quotationLines.findIndex(l => l.id === line.id) + 1;
            
            if (!line.price || parseFloat(line.price) <= 0) {
                error = `第 ${rowNum} 行的价格必须大于0`;
                return false;
            }
        }
        
        return true;
    }
    
    // 提交表单
    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        success = '';
        
        if (!validateForm()) {
            return;
        }
        
        const validLines = quotationLines.filter(l => l.item !== null);
        
        submitting = true;
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];
        
        // 逐个提交报价
        for (const line of validLines) {
            try {
                const requestData: CustomerQuotationCreateRequest = {
                    customer: selectedCustomer!,
                    item: line.item,
                    price: line.price,
                    currency: customerCurrency,
                    min_quantity: line.min_quantity,
                    lead_time_days: line.lead_time_days,
                    note: line.note,
                };
                
                await customerQuotationAPI.create(requestData);
                successCount++;
            } catch (err) {
                failCount++;
                const rowNum = quotationLines.findIndex(l => l.id === line.id) + 1;
                const itemName = line.itemDetail?.name || '未知物品';
                errors.push(`第 ${rowNum} 行 (${itemName}): ${err instanceof Error ? err.message : '创建失败'}`);
            }
        }
        
        submitting = false;
        
        if (successCount > 0) {
            success = `成功创建 ${successCount} 个报价`;
        }
        
        if (failCount > 0) {
            error = `${failCount} 个报价创建失败:\n${errors.join('\n')}`;
        } else if (successCount > 0) {
            // 全部成功，延迟跳转
            setTimeout(() => {
                goto(`/customer/${selectedCustomer}`);
            }, 1500);
        }
    }
    
    function goBack() {
        const customerId = presetCustomerId();
        if (customerId) {
            goto(`/customer/${customerId}`);
        } else {
            goto('/customer');
        }
    }
    
    onMount(async () => {
        await loadInitialData();
        loading = false;
    });
</script>

<svelte:head>
    <title>添加客户报价 - AnyWarehouse</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">添加客户报价</h1>
            <p class="text-sm text-gray-500 mt-1">为客户创建新的报价记录，选择物品自动添加一行</p>
        </div>
        <div class="flex gap-3">
            <button 
                type="button" 
                class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                onclick={goBack}
            >
                取消
            </button>
            <button 
                type="submit" 
                form="quotationForm"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                disabled={submitting}
            >
                {submitting ? '保存中...' : '保存'}
            </button>
        </div>
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else}
        <form id="quotationForm" onsubmit={handleSubmit} class="space-y-6">
            <!-- 提示消息 -->
            {#if error}
                <Alert {error} />
            {/if}
            {#if success}
                <Alert error={success} variant="info" />
            {/if}
            
            <!-- 客户选择卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">客户信息</h2>
                </div>
                <div class="p-6">
                    <div class="max-w-md">
                        <label for="customer" class="block text-sm font-medium text-gray-700 mb-1">
                            选择客户 <span class="text-red-500">*</span>
                        </label>
                        <Svelecte
                            inputId="customer"
                            name="customer"
                            options={customerOptions}
                            bind:value={selectedCustomer}
                            placeholder="选择客户..."
                            searchable={true}
                            disabled={!!presetCustomerId()}
                            required
                        />
                    </div>
                </div>
            </div>
            
            <!-- 报价列表卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        报价列表
                        <span class="ml-2 text-xs font-normal text-gray-500">
                            (共 {quotationLines.filter(l => l.item !== null).length} 个有效报价)
                        </span>
                    </h2>
                    <button
                        type="button"
                        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onclick={() => addLine()}
                    >
                        + 手动添加行
                    </button>
                </div>
                
                <div class="overflow-visible">
                    <table class="w-full text-sm min-w-[1200px]">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-12">#</th>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-[200px]">物品 *</th>
                                <th class="px-3 py-3 text-right font-medium text-gray-700 w-24">参考价</th>
                                <th class="px-3 py-3 text-right font-medium text-gray-700 w-28">报价 *</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">货币</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">MOQ</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-24">交货周期</th>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-[100px]">备注</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-16">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {#each quotationLines as line, index (line.id)}
                                {@const parentIndex = line.parentLineId ? quotationLines.findIndex(l => l.id === line.parentLineId) + 1 : null}
                                {@const siblingIndex = line.parentLineId ? quotationLines.filter(l => l.parentLineId === line.parentLineId).findIndex(l => l.id === line.id) + 1 : null}
                                {@const displayIndex = line.isVariantChild && parentIndex ? `${parentIndex}-${siblingIndex}` : String(index + 1)}
                                <tr class="{line.isVariantChild ? 'bg-purple-50/50' : 'hover:bg-gray-50'}">
                                    <td class="px-3 py-3 {line.isVariantChild ? 'text-purple-600' : 'text-gray-500'}">{displayIndex}</td>
                                    <td class="px-3 py-3">
                                        {#if line.isVariantChild}
                                            <!-- 变体子项：显示缩进和物品信息（不可编辑） -->
                                            <div class="flex items-center gap-2">
                                                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span class="text-sm font-medium text-gray-800">
                                                    {line.itemDetail?.SKU || line.variantInfo?.variant_item_detail?.SKU || '-'}
                                                </span>
                                                <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                            </div>
                                            <div class="text-xs text-gray-500 mt-1 pl-6">
                                                {line.itemDetail?.name || line.variantInfo?.variant_item_detail?.name || '-'}
                                            </div>
                                        {:else}
                                            <!-- 普通行：可编辑的 Svelecte -->
                                            {#if line.itemDetail}
                                                <!-- 已加载物品详情，直接显示 -->
                                                <div class="text-sm font-medium text-gray-800">
                                                    {line.itemDetail.SKU} - {line.itemDetail.name}
                                                </div>
                                            {:else}
                                                <!-- 未选择物品，显示 Svelecte -->
                                                <Svelecte
                                                    inputId="item-{line.id}"
                                                    name="item-{line.id}"
                                                    valueAsObject={false}
                                                    placeholder="搜索SKU或名称..."
                                                    searchable={true}
                                                    minQuery={1}
                                                    fetch={itemSearchUrl}
                                                    fetchCallback={handleItemFetch}
                                                    valueField="value"
                                                    labelField="label"
                                                    onChange={(val: unknown) => handleSelectChange(line, val)}
                                                />
                                            {/if}
                                        {/if}
                                    </td>
                                    <!-- 参考价列 -->
                                    <td class="px-3 py-3 text-right">
                                        {#if line.itemDetail?.b_Price}
                                            <span class="text-sm text-gray-500">
                                                {line.itemDetail.b_Price} {line.itemDetail.currency || 'CNY'}
                                            </span>
                                        {:else}
                                            <span class="text-sm text-gray-300">-</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="price-{line.id}"
                                            value={line.price ? Number(line.price) : undefined}
                                            min={0}
                                            step={0.01}
                                            decimalPlaces={2}
                                            size="sm"
                                            placeholder="0.00"
                                            onchange={(v) => line.price = v !== undefined && v !== null ? v.toFixed(2) : ''}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                            {customerCurrency}
                                        </span>
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="moq-{line.id}"
                                            value={line.min_quantity}
                                            min={1}
                                            step={1}
                                            decimalPlaces={0}
                                            size="sm"
                                            onchange={(v) => line.min_quantity = v ?? 1}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="lead-{line.id}"
                                            value={line.lead_time_days ?? undefined}
                                            min={1}
                                            step={1}
                                            decimalPlaces={0}
                                            size="sm"
                                            placeholder="天数"
                                            onchange={(v) => line.lead_time_days = v ?? null}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <input
                                            type="text"
                                            bind:value={line.note}
                                            placeholder="备注"
                                            class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                    </td>
                                    <td class="px-3 py-3 text-center">
                                        <button
                                            type="button"
                                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            onclick={() => removeLine(line.id)}
                                            title="删除此行"
                                            aria-label="删除此行"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                
                {#if quotationLines.length === 0}
                    <div class="text-center py-8 text-gray-500">
                        <p>暂无报价行，请选择物品或手动添加</p>
                    </div>
                {/if}
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex justify-between items-center pt-4">
                <div class="text-sm text-gray-500">
                    提示：选择物品后将自动添加新行，可一次性添加多个报价
                </div>
                <div class="flex gap-4">
                    <button 
                        type="button" 
                        class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        onclick={goBack}
                    >
                        取消
                    </button>
                    <button 
                        type="submit" 
                        class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        disabled={submitting}
                    >
                        {submitting ? '保存中...' : '保存报价'}
                    </button>
                </div>
            </div>
        </form>
    {/if}
</div>
