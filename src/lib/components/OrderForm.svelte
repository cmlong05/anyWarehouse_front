<script lang="ts">
    /**
     * 通用订单表单组件
     * 支持采购订单和销售订单
     */
    import type { OrderFormData, OrderFormItem } from '$lib/composables/useOrderForm.svelte';
    import { useOrderForm } from '$lib/composables/useOrderForm.svelte';
    import Svelecte from 'svelecte';
    
    export type OrderType = 'purchase' | 'sales';
    
    interface QuotationOption {
        value: number;
        label: string;
        quotation: unknown;
    }
    
    interface Labels {
        partner: string;
        shipping: string;
        orderSection: string;
        shippingSection: string;
        feesSection: string;
        itemsSection: string;
        notesSection: string;
        partnerVisibleNote: string;
        internalNote: string;
    }
    
    interface Props {
        // 订单类型
        type: OrderType;
        // 合作伙伴信息
        partnerId: number;
        partnerName?: string;
        // 初始数据（编辑模式）
        initialData?: Partial<OrderFormData>;
        // 报价选项
        quotationOptions: QuotationOption[];
        loadingQuotations?: boolean;
        // 标签配置
        labels: Labels;
        // 状态
        loading?: boolean;
        submitLabel?: string;
        // 回调
        onSubmit: (data: Record<string, unknown>) => void;
        onCancel: () => void;
    }
    
    let {
        type,
        partnerId,
        partnerName = '加载中...',
        initialData = {},
        quotationOptions,
        loadingQuotations = false,
        labels,
        loading = false,
        submitLabel = '保存',
        onSubmit,
        onCancel
    }: Props = $props();
    
    // 使用 useOrderForm composable
    const {
        formData,
        errors,
        itemErrors,
        currentItem,
        subtotal,
        taxAmount,
        totalAmount,
        priorityOptions,
        validate,
        validateItem,
        addItem,
        resetCurrentItem,
        removeItem,
        setCurrentItemQuotation,
        prepareSubmitData,
    } = useOrderForm(partnerId, initialData);
    
    // 监听报价选择变化
    $effect(() => {
        const selectedId = currentItem.quotation;
        const selected = quotationOptions.find(q => q.value === selectedId);
        if (selected && 'quotation' in selected) {
            const q = selected.quotation as { 
                id: number; 
                item?: number; 
                sku?: string; 
                item_name?: string; 
                price: string;
            };
            setCurrentItemQuotation(q);
        } else {
            setCurrentItemQuotation(undefined);
        }
    });
    
    // 处理添加明细
    function handleAddItem() {
        if (addItem()) {
            // 添加成功
        }
    }
    
    // 处理提交
    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            onSubmit(prepareSubmitData(type));
        }
    }
</script>

<form class="order-form" onsubmit={handleSubmit}>
    <!-- 订单基本信息 -->
    <div class="form-section">
        <h3 class="section-title">{partnerName}</h3>
        <input type="hidden" value={partnerId} />
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
    
    <!-- 收货信息 -->
    <div class="form-section">
        <h3 class="section-title">{labels.shippingSection}</h3>
        <div class="form-grid">
            <div class="form-group full-width">
                <label for="shipping_address">{labels.shipping}地址</label>
                <input
                    type="text"
                    id="shipping_address"
                    bind:value={formData.shipping_address}
                    placeholder="请输入{labels.shipping}地址"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="contact_person">{labels.shipping}联系人</label>
                <input
                    type="text"
                    id="contact_person"
                    bind:value={formData.contact_person}
                    placeholder="请输入联系人"
                    disabled={loading}
                />
            </div>
            
            <div class="form-group">
                <label for="contact_phone">{labels.shipping}电话</label>
                <input
                    type="tel"
                    id="contact_phone"
                    bind:value={formData.contact_phone}
                    placeholder="请输入联系电话"
                    disabled={loading}
                />
            </div>
        </div>
    </div>
    
    <!-- 订单明细 -->
    <div class="form-section">
        <h3 class="section-title">{labels.itemsSection}</h3>
        
        <!-- 添加明细表单 -->
        <div class="add-item-form">
            <div class="form-row">
                <div class="form-group item-select">
                    <label for="item-select">选择SKU <span class="required">*</span></label>
                    <Svelecte
                        inputId="item-select"
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
                    <label for="item-quantity">数量</label>
                    <input
                        type="number"
                        id="item-quantity"
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
                
                <div class="form-group action-group">
                    <span class="label-placeholder">&nbsp;</span>
                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick={handleAddItem}
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
                        <td></td>
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
    
    <!-- 费用信息 -->
    <div class="form-section">
        <h3 class="section-title">{labels.feesSection}</h3>
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
    
    <!-- 备注 -->
    <div class="form-section">
        <h3 class="section-title">{labels.notesSection}</h3>
        <div class="form-group full-width">
            <label for="notes">订单备注</label>
            <textarea
                id="notes"
                bind:value={formData.notes}
                placeholder="输入订单备注（{labels.partnerVisibleNote}）"
                rows="2"
                disabled={loading}
            ></textarea>
        </div>
        
        <div class="form-group full-width">
            <label for="internal_notes">内部备注</label>
            <textarea
                id="internal_notes"
                bind:value={formData.internal_notes}
                placeholder="输入内部备注（{labels.internalNote}）"
                rows="2"
                disabled={loading}
            ></textarea>
        </div>
    </div>
    
    <!-- 操作按钮 -->
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
    .order-form {
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
    
    .form-group.item-select {
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
        background-color: #e9ecef;
        cursor: not-allowed;
    }
    
    .error-message {
        color: #dc3545;
        font-size: 0.8rem;
    }
    
    .add-item-form {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
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
    
    .form-group.action-group {
        flex: 0;
        min-width: auto;
    }
    
    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    .items-table th,
    .items-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .items-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #555;
    }
    
    .items-table .numeric {
        text-align: right;
    }
    
    .items-table .editable input {
        width: 100%;
    }
    
    .items-table .narrow {
        width: 100px;
    }
    
    .table-input {
        padding: 0.25rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        width: 80px;
        text-align: right;
    }
    
    .table-input:focus {
        outline: none;
        border-color: #007bff;
    }
    
    .text-right {
        text-align: right;
    }
    
    .fees-grid {
        align-items: start;
    }
    
    .fee-summary {
        grid-column: span 2;
        background: #f8f9fa;
        padding: 1rem;
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
        font-weight: 600;
        font-size: 1.1rem;
        border-top: 1px solid #ddd;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
    }
    
    .empty-items {
        text-align: center;
        padding: 2rem;
        color: #666;
        background: #f8f9fa;
        border-radius: 4px;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1rem;
    }
    
    .btn {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s ease;
    }
    
    .btn:hover:not(:disabled) {
        opacity: 0.9;
    }
    
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
    }
    
    .btn-icon {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        padding: 0;
    }
    
    .btn-icon:hover:not(:disabled) {
        background: #c82333;
    }
    
    .btn-icon:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .form-row {
            flex-direction: column;
        }
        
        .form-group.item-select {
            min-width: auto;
        }
        
        .fee-summary {
            grid-column: 1;
        }
        
        .items-table {
            font-size: 0.8rem;
        }
        
        .items-table th,
        .items-table td {
            padding: 0.5rem 0.25rem;
        }
    }
</style>
