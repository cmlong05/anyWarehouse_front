<script lang="ts">
    import type { 
        SalesOrder, 
        SalesOrderCreateRequest, 
        SalesOrderItemCreateRequest,
        CustomerQuotationBrief,
        Customer
    } from '$lib';
    import { customerAPI } from '$lib/api';
    import Svelecte from 'svelecte';
    import { onMount } from 'svelte';
    
    interface Props {
        salesOrder?: SalesOrder;
        customerId: number;
        customer?: Customer;
        preloadItems?: any[] | null;
        onSubmit: (data: SalesOrderCreateRequest) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        salesOrder, 
        customerId,
        customer,
        preloadItems,
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 优先级选项
    const priorityOptions = [
        { value: 'low', label: '低' },
        { value: 'normal', label: '普通' },
        { value: 'high', label: '高' },
        { value: 'urgent', label: '紧急' },
    ];
    
    // 获取今天的日期字符串
    function getTodayString(): string {
        return new Date().toISOString().split('T')[0];
    }
    
    // 表单数据
    let formData: SalesOrderCreateRequest = $state({
        customer: customerId,
        priority: salesOrder?.priority ?? 'normal',
        order_date: salesOrder?.order_date ?? getTodayString(),
        expected_delivery: salesOrder?.expected_delivery ?? '',
        tax_rate: salesOrder?.tax_rate ? parseFloat(salesOrder.tax_rate) : 0,
        shipping_cost: salesOrder?.shipping_cost ? parseFloat(salesOrder.shipping_cost) : 0,
        discount: salesOrder?.discount ? parseFloat(salesOrder.discount) : 0,
        shipping_address: salesOrder?.shipping_address ?? '',
        contact_person: salesOrder?.contact_person ?? '',
        contact_phone: salesOrder?.contact_phone ?? '',
        payment_terms: salesOrder?.payment_terms ?? '',
        notes: salesOrder?.notes ?? '',
        internal_notes: salesOrder?.internal_notes ?? '',
        items: preloadItems?.map(item => ({
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            quotation: item.quotation_id || null,
            expected_delivery: null,
            notes: ''
        })) || [],
    });
    
    // 临时存储正在添加的明细
    let currentItem: Partial<SalesOrderItemCreateRequest> = $state({
        quantity: 1,
        unit_price: 0,
        notes: ''
    });
    
    // 错误信息
    let errors: Record<string, string> = $state({});
    let itemErrors: Record<string, string> = $state({});
    
    // 客户报价列表（用于SKU选择）
    let quotations = $state<CustomerQuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.sku || '-'} - ${q.item_name || '-'} (¥${q.price})`,
        quotation: q
    })));
    
    // 加载客户报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await customerAPI.getQuotations(customerId);
            quotations = result.results || result || [];
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            loadingQuotations = false;
        }
    }
    
    onMount(() => {
        loadQuotations();
    });
    
    // 计算小计
    let subtotal = $derived(
        formData.items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0)
    );
    
    // 计算税额
    let taxAmount = $derived(subtotal * (Number(formData.tax_rate) / 100));
    
    // 计算总计
    let totalAmount = $derived(
        subtotal + taxAmount + Number(formData.shipping_cost) - Number(formData.discount)
    );
    
    // 监听报价选择变化，自动填充相关信息
    $effect(() => {
        const selectedId = currentItem.quotation;
        if (!selectedId) {
            currentItem.item = undefined;
            currentItem.sku = '';
            currentItem.item_name = '';
            currentItem.unit_price = 0;
            return;
        }
        
        const selected = quotations.find(q => q.id === selectedId);
        if (selected) {
            currentItem.item = selected.item;
            currentItem.sku = selected.sku || '';
            currentItem.item_name = selected.item_name || '';
            currentItem.unit_price = parseFloat(selected.price);
        }
    });
    
    function validate(): boolean {
        errors = {};
        
        if (!formData.order_date) {
            errors.order_date = '请选择下单日期';
        }
        
        if (formData.expected_delivery && formData.order_date > formData.expected_delivery) {
            errors.expected_delivery = '预计交货日期不能早于下单日期';
        }
        
        if (formData.items.length === 0) {
            errors.items = '请至少添加一个明细项';
        }
        
        return Object.keys(errors).length === 0;
    }
    
    function validateItem(): boolean {
        itemErrors = {};
        
        if (!currentItem.quotation && !currentItem.sku?.trim()) {
            itemErrors.quotation = '请选择SKU';
        }
        
        if (!currentItem.quantity || currentItem.quantity <= 0) {
            itemErrors.quantity = '数量必须大于0';
        }
        
        const unitPrice = Number(currentItem.unit_price ?? 0);
        if (currentItem.unit_price === undefined || unitPrice < 0) {
            itemErrors.unit_price = '单价不能为负数';
        }
        
        // 检查SKU是否已存在
        const skuToAdd = currentItem.sku?.trim();
        if (skuToAdd && formData.items.some(item => item.sku === skuToAdd)) {
            itemErrors.quotation = `SKU "${skuToAdd}" 已存在于订单明细中`;
        }
        
        return Object.keys(itemErrors).length === 0;
    }
    
    function addItem() {
        if (!validateItem()) return;
        
        formData.items = [...formData.items, {
            item: currentItem.item || null,
            sku: currentItem.sku || '',
            item_name: currentItem.item_name || '',
            quantity: currentItem.quantity || 1,
            unit_price: currentItem.unit_price || 0,
            quotation: currentItem.quotation || null,
            expected_delivery: currentItem.expected_delivery || null,
            notes: currentItem.notes || ''
        }];
        
        // 重置当前项（清空所有字段，方便继续添加）
        currentItem = {
            item: undefined,
            sku: '',
            item_name: '',
            quantity: 1,
            unit_price: 0,
            quotation: null,
            expected_delivery: undefined,
            notes: ''
        };
        itemErrors = {};
    }
    
    function removeItem(index: number) {
        formData.items = formData.items.filter((_, i) => i !== index);
    }
    
    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            // 转换数据格式以匹配后端期望
            const submitData = {
                ...formData,
                // 将空字符串转换为 null
                expected_delivery: formData.expected_delivery || null,
                shipping_address: formData.shipping_address || undefined,
                contact_person: formData.contact_person || undefined,
                contact_phone: formData.contact_phone || undefined,
                payment_terms: formData.payment_terms || undefined,
                notes: formData.notes || undefined,
                internal_notes: formData.internal_notes || undefined,
                // 确保数值字段是数字
                tax_rate: Number(formData.tax_rate) || 0,
                shipping_cost: Number(formData.shipping_cost) || 0,
                discount: Number(formData.discount) || 0,
            };
            onSubmit(submitData as SalesOrderCreateRequest);
        }
    }
</script>

<form class="sales-order-form" onsubmit={handleSubmit}>
    <div class="form-section">
        <h3 class="section-title">{customer?.name || '加载中...'}</h3>
        <input type="hidden" bind:value={formData.customer} />
        <div class="form-grid">
            
            <div class="form-group">
                <label for="priority">优先级</label>
                <select id="priority" bind:value={formData.priority} disabled={loading}>
                    {#each priorityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="form-group">
                <label for="order_date">下单日期 <span class="required">*</span></label>
                <input
                    type="date"
                    id="order_date"
                    bind:value={formData.order_date}
                    disabled={loading}
                />
                {#if errors.order_date}
                    <span class="error-message">{errors.order_date}</span>
                {/if}
            </div>
            
            <div class="form-group">
                <label for="expected_delivery">预计交货日期</label>
                <input
                    type="date"
                    id="expected_delivery"
                    bind:value={formData.expected_delivery}
                    disabled={loading}
                />
                {#if errors.expected_delivery}
                    <span class="error-message">{errors.expected_delivery}</span>
                {/if}
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3 class="section-title">收货信息</h3>
        <div class="form-grid">
            <div class="form-group full-width">
                <label for="shipping_address">收货地址</label>
                <input
                    type="text"
                    id="shipping_address"
                    bind:value={formData.shipping_address}
                    placeholder="请输入收货地址"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="contact_person">收货联系人</label>
                <input
                    type="text"
                    id="contact_person"
                    bind:value={formData.contact_person}
                    placeholder="请输入联系人"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="contact_phone">收货电话</label>
                <input
                    type="text"
                    id="contact_phone"
                    bind:value={formData.contact_phone}
                    placeholder="请输入联系电话"
                    disabled={loading}
                />
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3 class="section-title">金额信息</h3>
        <div class="form-grid">
            <div class="form-group">
                <label for="tax_rate">税率 (%)</label>
                <input
                    type="number"
                    id="tax_rate"
                    bind:value={formData.tax_rate}
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="shipping_cost">运费</label>
                <input
                    type="number"
                    id="shipping_cost"
                    bind:value={formData.shipping_cost}
                    min="0"
                    step="0.01"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="discount">折扣</label>
                <input
                    type="number"
                    id="discount"
                    bind:value={formData.discount}
                    min="0"
                    step="0.01"
                    disabled={loading}
                />
            </div>
        </div>
        
        <div class="amount-summary">
            <div class="amount-row">
                <span>商品小计:</span>
                <span class="amount">¥{subtotal.toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>税额 ({formData.tax_rate}%):</span>
                <span class="amount">¥{taxAmount.toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>运费:</span>
                <span class="amount">¥{Number(formData.shipping_cost).toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>折扣:</span>
                <span class="amount">-¥{Number(formData.discount).toFixed(2)}</span>
            </div>
            <div class="amount-row total">
                <span>订单总计:</span>
                <span class="amount">¥{totalAmount.toFixed(2)}</span>
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3 class="section-title">订单明细</h3>
        
        <!-- 添加明细表单 -->
        <div class="add-item-form">
            <div class="form-row">
                <div class="form-group item-select">
                    <label for="quotation-select">选择报价/SKU</label>
                    <Svelecte
                        inputId="quotation-select"
                        options={quotationOptions}
                        bind:value={currentItem.quotation}
                        placeholder="搜索SKU或选择报价..."
                        searchable={true}
                        disabled={loading || loadingQuotations}
                    />
                    {#if itemErrors.quotation}
                        <span class="error-message">{itemErrors.quotation}</span>
                    {/if}
                </div>
                
                <div class="form-group quantity">
                    <label for="item-quantity">数量</label>
                    <input
                        id="item-quantity"
                        type="number"
                        bind:value={currentItem.quantity}
                        min="0.001"
                        step="0.001"
                        disabled={loading}
                    />
                    {#if itemErrors.quantity}
                        <span class="error-message">{itemErrors.quantity}</span>
                    {/if}
                </div>
                
                <div class="form-group price">
                    <label for="item-price">单价</label>
                    <input
                        id="item-price"
                        type="number"
                        bind:value={currentItem.unit_price}
                        min="0"
                        step="0.01"
                        disabled={loading}
                    />
                    {#if itemErrors.unit_price}
                        <span class="error-message">{itemErrors.unit_price}</span>
                    {/if}
                </div>
                
                <div class="form-group actions">
                    <span class="label-placeholder">&nbsp;</span>
                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick={addItem}
                        disabled={loading}
                    >
                        添加
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 明细列表 -->
        {#if formData.items.length > 0}
            <table class="items-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>物品名称</th>
                        <th class="numeric">数量</th>
                        <th class="numeric">单价</th>
                        <th class="numeric">小计</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each formData.items as item, index}
                        <tr>
                            <td>{item.sku || '-'}</td>
                            <td>{item.item_name || '-'}</td>
                            <td class="numeric">
                                <input
                                    type="number"
                                    class="inline-input"
                                    bind:value={formData.items[index].quantity}
                                    min="0.001"
                                    step="0.001"
                                    disabled={loading}
                                />
                            </td>
                            <td class="numeric">
                                <input
                                    type="number"
                                    class="inline-input"
                                    bind:value={formData.items[index].unit_price}
                                    min="0"
                                    step="0.01"
                                    disabled={loading}
                                />
                            </td>
                            <td class="numeric">¥{(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                            <td>
                                <button
                                    type="button"
                                    class="btn-icon"
                                    onclick={() => removeItem(index)}
                                    disabled={loading}
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <div class="empty-items">
                {#if errors.items}
                    <span class="error-message">{errors.items}</span>
                {:else}
                    <p>暂无明细，请添加至少一个物品</p>
                {/if}
            </div>
        {/if}
    </div>
    
    <div class="form-section">
        <h3 class="section-title">备注</h3>
        <div class="form-group full-width">
            <label for="notes">订单备注（客户可见）</label>
            <textarea
                id="notes"
                bind:value={formData.notes}
                rows="3"
                placeholder="请输入订单备注..."
                disabled={loading}
            ></textarea>
        </div>
        
        <div class="form-group full-width">
            <label for="internal_notes">内部备注（仅内部可见）</label>
            <textarea
                id="internal_notes"
                bind:value={formData.internal_notes}
                rows="2"
                placeholder="请输入内部备注..."
                disabled={loading}
            ></textarea>
        </div>
    </div>
    
    <div class="form-actions">
        <button
            type="button"
            class="btn btn-secondary"
            onclick={onCancel}
            disabled={loading}
        >
            取消
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            disabled={loading}
        >
            {loading ? '保存中...' : submitLabel}
        </button>
    </div>
</form>

<style>
    .sales-order-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .form-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
    }
    
    .section-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    .form-group label .required {
        color: #dc2626;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        ring: 2px solid #bfdbfe;
    }
    
    .error-message {
        color: #dc2626;
        font-size: 0.75rem;
    }
    
    .amount-summary {
        margin-top: 1rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.375rem;
    }
    
    .amount-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
    }
    
    .amount-row.total {
        font-weight: 600;
        font-size: 1.1rem;
        border-top: 1px solid #e5e7eb;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
    }
    
    .amount {
        font-family: monospace;
    }
    
    .add-item-form {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }
    
    .form-row {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        flex-wrap: wrap;
    }
    
    .form-row .form-group {
        flex: 1;
        min-width: 120px;
    }
    
    .form-row .form-group.item-select {
        flex: 2;
        min-width: 250px;
    }
    
    .form-row .form-group.quantity,
    .form-row .form-group.price {
        flex: 0.5;
        min-width: 100px;
    }
    
    .form-row .form-group.actions {
        flex: 0;
        min-width: auto;
    }
    
    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    .items-table th,
    .items-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table th {
        background: #f9fafb;
        font-weight: 600;
    }
    
    .items-table .numeric {
        text-align: right;
    }

    .inline-input {
        width: 80px;
        padding: 0.25rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.85rem;
        text-align: right;
        background: white;
    }

    .inline-input:focus {
        outline: none;
        border-color: #3b82f6;
    }

    /* 隐藏数字输入框的上下调整按钮 */
    .inline-input::-webkit-outer-spin-button,
    .inline-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .inline-input {
        -moz-appearance: textfield;
        appearance: textfield;
    }
    
    .empty-items {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #2563eb;
    }
    
    .btn-secondary {
        background: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background: #4b5563;
    }
    
    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.6;
        transition: opacity 0.15s;
    }
    
    .btn-icon:hover:not(:disabled) {
        opacity: 1;
    }
</style>
