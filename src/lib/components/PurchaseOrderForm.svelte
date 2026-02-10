<script lang="ts">
    import type { 
        PurchaseOrder, 
        PurchaseOrderCreateRequest, 
        PurchaseOrderItemCreateRequest,
        QuotationBrief,
        SupplierBrief
    } from '$lib';
    import { supplierAPI } from '$lib/api';
    import Svelecte from 'svelecte';
    import { onMount } from 'svelte';
    
    interface Props {
        purchaseOrder?: PurchaseOrder;
        supplierId: number;
        supplier?: SupplierBrief;
        preloadItems?: any[] | null;
        onSubmit: (data: PurchaseOrderCreateRequest) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        purchaseOrder, 
        supplierId,
        supplier,
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
    let formData: PurchaseOrderCreateRequest = $state({
        supplier: supplierId,
        priority: purchaseOrder?.priority ?? 'normal',
        order_date: purchaseOrder?.order_date ?? getTodayString(),
        expected_delivery: purchaseOrder?.expected_delivery ?? '',
        tax_rate: purchaseOrder?.tax_rate ? parseFloat(purchaseOrder.tax_rate) : 0,
        shipping_cost: purchaseOrder?.shipping_cost ? parseFloat(purchaseOrder.shipping_cost) : 0,
        discount: purchaseOrder?.discount ? parseFloat(purchaseOrder.discount) : 0,
        shipping_address: purchaseOrder?.shipping_address ?? '',
        contact_person: purchaseOrder?.contact_person ?? '',
        contact_phone: purchaseOrder?.contact_phone ?? '',
        payment_terms: purchaseOrder?.payment_terms ?? '',
        notes: purchaseOrder?.notes ?? '',
        internal_notes: purchaseOrder?.internal_notes ?? '',
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
    let currentItem: Partial<PurchaseOrderItemCreateRequest> = $state({
        quantity: 1,
        unit_price: 0,
        notes: ''
    });
    

    
    // 错误信息
    let errors: Record<string, string> = $state({});
    let itemErrors: Record<string, string> = $state({});
    
    // 供应商报价列表（用于SKU选择）
    let quotations = $state<QuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.sku || '-'} - ${q.item_name || '-'} (¥${q.price})`,
        quotation: q
    })));
    
    // 加载供应商报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await supplierAPI.getQuotations(supplierId);
            quotations = result.quotations;
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
            onSubmit(submitData as PurchaseOrderCreateRequest);
        }
    }
</script>

<form class="purchase-order-form" onsubmit={handleSubmit}>
    <div class="form-section">
        <h3 class="section-title">{supplier?.name || '加载中...'}</h3>
        <input type="hidden" bind:value={formData.supplier} />
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
                    placeholder="请输入收货联系人"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="contact_phone">收货电话</label>
                <input
                    type="tel"
                    id="contact_phone"
                    bind:value={formData.contact_phone}
                    placeholder="请输入收货电话"
                    disabled={loading}
                />
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3 class="section-title">订单明细</h3>
        
        <!-- 添加明细表单 -->
        <div class="add-item-form">
            <div class="form-row">
                <div class="form-group sku-group">
                    <label for="item-sku">选择SKU <span class="required">*</span></label>
                    <Svelecte
                        inputId="item-sku"
                        options={quotationOptions}
                        bind:value={currentItem.quotation}
                        valueAsObject={false}
                        placeholder={loadingQuotations ? '加载中...' : '搜索SKU或物品名称...'}
                        searchable={true}
                        clearable={true}
                        disabled={loading || loadingQuotations}
                    />
                    {#if itemErrors.quotation}
                        <span class="error-message">{itemErrors.quotation}</span>
                    {/if}
                </div>
                
                <div class="form-group small">
                    <label for="item-qty">数量</label>
                    <input
                        type="number"
                        id="item-qty"
                        bind:value={currentItem.quantity}
                        min="0.001"
                        step="0.001"
                        disabled={loading}
                    />
                    {#if itemErrors.quantity}
                        <span class="error-message">{itemErrors.quantity}</span>
                    {/if}
                </div>
                
                <div class="form-group small">
                    <label for="item-price">单价</label>
                    <input
                        type="number"
                        id="item-price"
                        bind:value={currentItem.unit_price}
                        min="0"
                        step="0.01"
                        disabled={loading}
                    />
                    {#if itemErrors.unit_price}
                        <span class="error-message">{itemErrors.unit_price}</span>
                    {/if}
                </div>
                
                <div class="form-group">
                    <label for="item-notes">备注</label>
                    <input
                        type="text"
                        id="item-notes"
                        bind:value={currentItem.notes}
                        placeholder="备注"
                        disabled={loading}
                    />
                </div>
                
                <div class="form-group action-group">
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
                        <th>#</th>
                        <th>SKU</th>
                        <th>物品名称</th>
                        <th class="numeric">数量</th>
                        <th class="numeric">单价</th>
                        <th class="numeric">小计</th>
                        <th>备注</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each formData.items as item, index}
                        <tr>
                            <td>{index + 1}</td>
                            <td>{item.sku || '-'}</td>
                            <td>{item.item_name || '-'}</td>
                            <td class="numeric editable narrow">
                                <input
                                    type="number"
                                    class="table-input"
                                    bind:value={formData.items[index].quantity}
                                    min="0.001"
                                    step="0.001"
                                    disabled={loading}
                                />
                            </td>
                            <td class="numeric editable narrow">
                                <input
                                    type="number"
                                    class="table-input"
                                    bind:value={formData.items[index].unit_price}
                                    min="0"
                                    step="0.01"
                                    disabled={loading}
                                />
                            </td>
                            <td class="numeric">¥{(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                            <td class="editable">
                                <input
                                    type="text"
                                    class="table-input text-left"
                                    bind:value={formData.items[index].notes}
                                    placeholder="-"
                                    disabled={loading}
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    class="btn-icon"
                                    onclick={() => removeItem(index)}
                                    disabled={loading}
                                    title="删除"
                                >
                                    ×
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="text-right">小计:</td>
                        <td class="numeric">¥{subtotal.toFixed(2)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        {:else}
            <div class="empty-items">
                <p>暂无明细项，请在上方添加</p>
                {#if errors.items}
                    <span class="error-message">{errors.items}</span>
                {/if}
            </div>
        {/if}
    </div>
    
    <div class="form-section">
        <h3 class="section-title">费用信息</h3>
        <div class="form-grid fees-grid">
            <div class="form-group small">
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
            
            <div class="form-group small">
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
            
            <div class="form-group small">
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
            
            <div class="form-group fee-summary">
                <div class="fee-row">
                    <span>商品小计:</span>
                    <span>¥{subtotal.toFixed(2)}</span>
                </div>
                <div class="fee-row">
                    <span>税额:</span>
                    <span>¥{taxAmount.toFixed(2)}</span>
                </div>
                <div class="fee-row">
                    <span>运费:</span>
                    <span>¥{Number(formData.shipping_cost).toFixed(2)}</span>
                </div>
                <div class="fee-row">
                    <span>折扣:</span>
                    <span>-¥{Number(formData.discount).toFixed(2)}</span>
                </div>
                <div class="fee-row total">
                    <span>订单总计:</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3 class="section-title">备注</h3>
        <div class="form-group full-width">
            <label for="notes">订单备注</label>
            <textarea
                id="notes"
                bind:value={formData.notes}
                placeholder="输入订单备注（供应商可见）"
                rows="2"
                disabled={loading}
            ></textarea>
        </div>
        
        <div class="form-group full-width">
            <label for="internal_notes">内部备注</label>
            <textarea
                id="internal_notes"
                bind:value={formData.internal_notes}
                placeholder="输入内部备注（供应商不可见）"
                rows="2"
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
    .purchase-order-form {
        max-width: 1200px;
    }
    
    .form-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #eee;
    }
    
    .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #333;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
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
    
    .form-group.small {
        max-width: 120px;
    }
    
    .form-group.sku-group {
        flex: 2;
        min-width: 300px;
    }
    
    .form-group label,
    .form-group .label-placeholder {
        font-weight: 500;
        color: #333;
        font-size: 0.85rem;
    }
    
    .required {
        color: #dc3545;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        padding: 0.5rem 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        transition: border-color 0.15s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #007bff;
    }
    
    .form-group input:disabled,
    .form-group select:disabled,
    .form-group textarea:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }
    

    
    /* 隐藏数字输入框的上下调整按钮 */
    .form-group input[type="number"]::-webkit-outer-spin-button,
    .form-group input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    .form-group input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
    }
    
    .error-message {
        color: #dc3545;
        font-size: 0.8rem;
    }
    
    /* 添加明细表单 */
    .add-item-form {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }
    
    .form-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        flex-wrap: wrap;
    }
    
    .form-row .form-group {
        flex: 1;
    }
    
    .form-row .form-group.sku-group {
        flex: 2;
        min-width: 300px;
    }
    
    .form-row .form-group.small {
        flex: 0 0 100px;
        max-width: 100px;
    }
    
    .form-row .form-group.action-group {
        flex: 0 0 auto;
    }
    
    /* 明细表格 */
    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    .items-table th,
    .items-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    
    .items-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #333;
    }
    
    .items-table .numeric {
        text-align: right;
    }
    
    .items-table tfoot {
        font-weight: 600;
    }
    
    .items-table tfoot td {
        border-top: 2px solid #ddd;
        padding-top: 0.75rem;
    }
    
    .text-right {
        text-align: right;
    }
    
    .empty-items {
        text-align: center;
        padding: 2rem;
        color: #666;
        background: #f8f9fa;
        border-radius: 4px;
    }
    
    /* 费用汇总 */
    .fees-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .fee-summary {
        margin-left: auto;
        background: #f8f9fa;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        min-width: 250px;
    }
    
    .fee-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .fee-row.total {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #ddd;
        font-weight: 600;
        font-size: 1.1rem;
        color: #007bff;
    }
    
    /* 按钮样式 */
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background-color: #007bff;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }
    
    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }
    
    .btn-icon {
        background: none;
        border: none;
        color: #dc3545;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        line-height: 1;
    }
    
    .btn-icon:hover:not(:disabled) {
        color: #a71d2a;
    }
    
    /* 表格内编辑输入框 */
    .items-table td.editable {
        padding: 0.25rem 0.5rem;
    }
    
    .items-table td.editable.narrow {
        width: 80px;
        min-width: 80px;
    }
    
    .table-input {
        width: 100%;
        padding: 0.4rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 0.85rem;
        text-align: right;
        background: white;
    }
    
    .table-input.text-left {
        text-align: left;
    }
    
    .table-input:focus {
        outline: none;
        border-color: #007bff;
    }
    
    .table-input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }
    
    /* 隐藏表格内数字输入框的上下调整按钮 */
    .table-input::-webkit-outer-spin-button,
    .table-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    .table-input {
        -moz-appearance: textfield;
        appearance: textfield;
    }
    
    /* 表单操作 */
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .form-row {
            flex-direction: column;
        }
        
        .form-row .form-group,
        .form-row .form-group.small,
        .form-row .form-group.sku-group {
            flex: 1;
            max-width: none;
            min-width: auto;
        }
        
        .items-table {
            font-size: 0.8rem;
        }
        
        .items-table th,
        .items-table td {
            padding: 0.5rem;
        }
        
        .fee-summary {
            margin-left: 0;
            width: 100%;
        }
        
        .form-actions {
            flex-direction: column-reverse;
        }
        
        .btn {
            width: 100%;
        }
    }
</style>
