/**
 * 订单表单 Composable
 * 
 * 提供采购订单和销售订单共享的表单逻辑
 */
import type { OrderItemCreateRequestBase } from '$lib/types/common';
import { getTodayString } from '$lib/utils';

export interface OrderFormItem extends OrderItemCreateRequestBase {
    id?: string; // 临时 ID，用于列表渲染
}

export interface OrderFormData {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    order_date: string;
    expected_delivery: string;
    tax_rate: number;
    shipping_cost: number;
    discount: number;
    shipping_address: string;
    contact_person: string;
    contact_phone: string;
    payment_terms: string;
    notes: string;
    internal_notes: string;
    items: OrderFormItem[];
}

export interface OrderFormErrors {
    order_date?: string;
    expected_delivery?: string;
    items?: string;
    [key: string]: string | undefined;
}

export interface OrderItemErrors {
    quotation?: string;
    sku?: string;
    quantity?: string;
    unit_price?: string;
    [key: string]: string | undefined;
}

/**
 * 创建订单表单状态
 * 
 * @param partnerId 合作伙伴 ID（供应商或客户）
 * @param initialData 初始数据（编辑模式）
 * @returns 订单表单相关的状态和方法
 */
export function useOrderForm(
    partnerId: number,
    initialData?: Partial<OrderFormData>
) {

    // 表单数据
    let formData = $state<OrderFormData>({
        priority: initialData?.priority ?? 'normal',
        order_date: initialData?.order_date ?? getTodayString(),
        expected_delivery: initialData?.expected_delivery ?? '',
        tax_rate: initialData?.tax_rate ?? 0,
        shipping_cost: initialData?.shipping_cost ?? 0,
        discount: initialData?.discount ?? 0,
        shipping_address: initialData?.shipping_address ?? '',
        contact_person: initialData?.contact_person ?? '',
        contact_phone: initialData?.contact_phone ?? '',
        payment_terms: initialData?.payment_terms ?? '',
        notes: initialData?.notes ?? '',
        internal_notes: initialData?.internal_notes ?? '',
        items: initialData?.items ?? [],
    });

    // 错误信息
    let errors = $state<OrderFormErrors>({});
    let itemErrors = $state<OrderItemErrors>({});

    // 当前正在添加的明细
    let currentItem = $state<Partial<OrderFormItem>>({
        quantity: 1,
        unit_price: 0,
        notes: ''
    });

    // 计算属性
    let subtotal = $derived(
        formData.items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0)
    );

    let taxAmount = $derived(subtotal * (Number(formData.tax_rate) / 100));

    let totalAmount = $derived(
        subtotal + taxAmount + Number(formData.shipping_cost) - Number(formData.discount)
    );

    // 优先级选项
    const priorityOptions = [
        { value: 'low' as const, label: '低' },
        { value: 'normal' as const, label: '普通' },
        { value: 'high' as const, label: '高' },
        { value: 'urgent' as const, label: '紧急' },
    ];

    /**
     * 验证表单
     */
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

    /**
     * 验证当前明细项
     */
    function validateItem(): boolean {
        itemErrors = {};
        
        if (!currentItem.quotation && !currentItem.sku?.trim()) {
            itemErrors.quotation = '请选择SKU';
            itemErrors.sku = '请选择SKU';
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
            const msg = `SKU "${skuToAdd}" 已存在于订单明细中`;
            itemErrors.quotation = msg;
            itemErrors.sku = msg;
        }
        
        return Object.keys(itemErrors).length === 0;
    }

    /**
     * 添加明细项
     */
    function addItem(): boolean {
        if (!validateItem()) return false;
        
        const newItem: OrderFormItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            item: currentItem.item || null,
            sku: currentItem.sku || '',
            item_name: currentItem.item_name || '',
            quantity: currentItem.quantity || 1,
            unit_price: currentItem.unit_price || 0,
            quotation: currentItem.quotation || null,
            expected_delivery: currentItem.expected_delivery || null,
            notes: currentItem.notes || ''
        };
        
        formData.items = [...formData.items, newItem];
        
        // 重置当前项
        resetCurrentItem();
        
        return true;
    }

    /**
     * 重置当前明细项
     */
    function resetCurrentItem() {
        // keep the same object reference to preserve bindings
        Object.assign(currentItem, {
            quantity: 1,
            unit_price: 0,
            notes: '',
            quotation: undefined,
            item: null,
            sku: '',
            item_name: ''
        });
        itemErrors = {};
    }

    /**
     * 删除明细项
     */
    function removeItem(index: number) {
        formData.items = formData.items.filter((_, i) => i !== index);
    }

    /**
     * 更新明细项字段
     */
    function updateItemField(index: number, field: keyof OrderFormItem, value: unknown) {
        formData.items = formData.items.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        );
    }

    /**
     * 设置当前项的报价（自动填充 SKU 和单价）
     */
    function setCurrentItemQuotation(quotation: { 
        id: number; 
        item?: number; 
        sku?: string; 
        item_name?: string; 
        price: string;
    } | undefined) {
        // mutate existing object rather than replace it so bindings using
        // a previously destructured reference stay reactive.
        if (!quotation) {
            // reset fields on the currentItem object
            Object.assign(currentItem, {
                quantity: 1,
                unit_price: 0,
                notes: '',
                quotation: undefined,
                item: null,
                sku: '',
                item_name: ''
            });
            return;
        }
        
        Object.assign(currentItem, {
            quotation: quotation.id,
            item: quotation.item,
            sku: quotation.sku || '',
            item_name: quotation.item_name || '',
            unit_price: parseFloat(quotation.price) || 0
        });
    }

    /**
     * 准备提交数据
     */
    function prepareSubmitData(type: 'purchase' | 'sales'): Record<string, unknown> {
        // 映射 items 为后端需要的格式
        const items = formData.items.map(item => ({
            item: item.item,
            sku: item.sku,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            quotation: item.quotation,
            expected_delivery: item.expected_delivery || null,
            notes: item.notes
        }));
        
        return {
            [type === 'sales' ? 'customer' : 'supplier']: partnerId,
            priority: formData.priority,
            order_date: formData.order_date,
            expected_delivery: formData.expected_delivery || null,
            shipping_address: formData.shipping_address || undefined,
            contact_person: formData.contact_person || undefined,
            contact_phone: formData.contact_phone || undefined,
            payment_terms: formData.payment_terms || undefined,
            notes: formData.notes || undefined,
            internal_notes: formData.internal_notes || undefined,
            tax_rate: Number(formData.tax_rate) || 0,
            shipping_cost: Number(formData.shipping_cost) || 0,
            discount: Number(formData.discount) || 0,
            items
        };
    }

    return {
        // 状态
        get formData() { return formData; },
        set formData(value) { formData = value; },
        get errors() { return errors; },
        set errors(value) { errors = value; },
        get itemErrors() { return itemErrors; },
        set itemErrors(value) { itemErrors = value; },
        get currentItem() { return currentItem; },
        set currentItem(value) { currentItem = value; },
        
        // 计算属性
        get subtotal() { return subtotal; },
        get taxAmount() { return taxAmount; },
        get totalAmount() { return totalAmount; },
        priorityOptions,
        
        // 方法
        validate,
        validateItem,
        addItem,
        resetCurrentItem,
        removeItem,
        updateItemField,
        setCurrentItemQuotation,
        prepareSubmitData,
    };
}

/**
 * 创建订单项选择器状态
 * 
 * 用于管理可选的订单明细项
 */
export function useOrderItemSelector<T extends { id: number; sku: string; item_name: string }>() {
    let availableItems = $state<T[]>([]);
    let selectedIds = $state<Set<number>>(new Set());
    
    let displayableItems = $derived(
        availableItems.filter(item => !selectedIds.has(item.id))
    );
    
    function selectItem(item: T) {
        selectedIds = new Set([...selectedIds, item.id]);
    }
    
    function deselectItem(itemId: number) {
        selectedIds = new Set([...selectedIds].filter(id => id !== itemId));
    }
    
    function clearSelection() {
        selectedIds = new Set();
    }
    
    function setAvailableItems(items: T[]) {
        availableItems = items;
    }
    
    return {
        get availableItems() { return availableItems; },
        set availableItems(value) { availableItems = value; },
        get selectedIds() { return selectedIds; },
        set selectedIds(value) { selectedIds = value; },
        get displayableItems() { return displayableItems; },
        selectItem,
        deselectItem,
        clearSelection,
        setAvailableItems,
    };
}
