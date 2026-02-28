# 前端可复用组件文档

本文档描述了前端代码中创建的可复用组件及其使用方法。

---

## 目录

1. [API 基类](#api-基类)
2. [通用类型定义](#通用类型定义)
3. [工具函数](#工具函数)
4. [表单 Composables](#表单-composables)

---

## API 基类

### BaseAPI

位置: `lib/api/base.ts`

通用的 CRUD API 基类，所有具体 API 类都可以继承此类。

```typescript
import { BaseAPI } from '$lib/api';
import type { MyEntity, MyCreateRequest } from '$lib';

export class MyEntityAPI extends BaseAPI<MyEntity, MyCreateRequest> {
    constructor() {
        super('/api/my-entities/');
    }
    
    // 添加特有方法
    async getByCategory(categoryId: number): Promise<MyEntity[]> {
        return this.client.get(`${this.basePath}by_category/`, { category_id: categoryId.toString() });
    }
}

// 使用
export const myEntityAPI = new MyEntityAPI();
const entities = await myEntityAPI.list({ page: 1 });
const entity = await myEntityAPI.get(1);
const created = await myEntityAPI.create({ name: 'Test' });
await myEntityAPI.update(1, { name: 'Updated' });
await myEntityAPI.delete(1);
```

**继承的方法:**
- `list(params?)` - 获取列表（分页）
- `get(id)` - 获取单个实体
- `create(data)` - 创建实体
- `update(id, data)` - 完整更新
- `patch(id, data)` - 部分更新
- `delete(id)` - 删除实体

### BaseOrderAPI

专门用于订单类 API（采购订单/销售订单）的基类。

```typescript
import { BaseOrderAPI } from '$lib/api';

export class PurchaseOrderAPI extends BaseOrderAPI<
    PurchaseOrder,      // 实体类型
    PurchaseOrderCreateRequest,  // 创建请求类型
    PurchaseOrderUpdateRequest,  // 更新请求类型
    PurchaseOrderItem,  // 明细类型
    PurchaseOrderStatistics,     // 统计类型
    PurchaseOrderSummary         // 汇总类型
> {
    constructor() {
        super('/supplier/purchase-orders/');
    }
    
    // 特有方法：收货
    async receive(orderId: number, data: ReceiveOrderRequest): Promise<PurchaseOrder> {
        return this.client.post(`${this.basePath}${orderId}/receive/`, data);
    }
}
```

**继承的订单相关方法:**
- `addItem(orderId, data)` - 添加订单明细
- `updateItem(orderId, itemId, data)` - 更新明细
- `removeItem(orderId, itemId)` - 删除明细
- `changeStatus(orderId, status, notes?)` - 变更状态
- `getStatistics(orderId)` - 获取统计
- `getSummary()` - 获取汇总

---

## 通用类型定义

位置: `lib/types/common.ts`

### 订单相关类型

```typescript
import type { 
    OrderBase, 
    OrderBrief, 
    OrderItemBase,
    OrderCreateRequestBase,
    OrderItemCreateRequestBase,
    OrderUpdateRequestBase,
    OrderStatistics,
    OrderSummary,
    PRIORITY_OPTIONS
} from '$lib';

// 优先级选项
const priority = 'high' as Priority;  // 'low' | 'normal' | 'high' | 'urgent'
```

### 合作伙伴类型

```typescript
import type { PartnerBase, PartnerBrief } from '$lib';

// 可用于供应商和客户的通用类型
interface MyPartner extends PartnerBase {
    custom_field: string;
}
```

---

## 工具函数

### 验证工具

位置: `lib/utils/validation.ts`

```typescript
import { 
    required, 
    email, 
    minLength, 
    maxLength, 
    min, 
    max, 
    range,
    combine,
    validateForm 
} from '$lib/utils';

// 单个验证
const error = required('名称不能为空')('');
// error = '名称不能为空'

// 组合验证
const validateName = combine(
    required(),
    minLength(2),
    maxLength(50)
);

// 表单验证
const { valid, errors } = validateForm(
    { name: '', email: 'invalid' },
    {
        name: combine(required(), minLength(2)),
        email: combine(required(), email())
    }
);
// valid = false
// errors = { name: '此字段不能为空', email: '请输入有效的邮箱地址' }
```

**可用的验证器:**
- `required(message?)` - 必填
- `minLength(length, message?)` - 最小长度
- `maxLength(length, message?)` - 最大长度
- `email(message?)` - 邮箱格式
- `min(min, message?)` - 最小值
- `max(max, message?)` - 最大值
- `range(min, max, message?)` - 范围
- `pattern(regex, message)` - 正则匹配
- `numeric(message?)` - 数字
- `positive(message?)` - 正数
- `nonNegative(message?)` - 非负数
- `mobilePhone(message?)` - 手机号
- `phone(message?)` - 电话号码
- `notBeforeToday(message?)` - 日期不早于今天
- `dateRange(startField, message?)` - 日期范围

### 格式化工具

位置: `lib/utils/formatters.ts`

```typescript
import { 
    formatDate, 
    formatDateOnly, 
    formatDateTime,
    formatMoney, 
    formatNumber,
    formatPercent,
    getTodayString,
    addDays,
    daysBetween
} from '$lib/utils';

formatDate(new Date());           // '2024-01-15 14:30'
formatDateOnly(new Date());       // '2024-01-15'
formatDateTime(new Date());       // '2024-01-15 14:30:00'
formatMoney(1234.56);             // '¥1,234.56'
formatMoney(1234.56, 2, '$');     // '$1,234.56'
formatNumber(1234567, 0);         // '1,234,567'
formatPercent(0.125, 1);          // '12.5%'
getTodayString();                 // '2024-01-15'
addDays(new Date(), 7);           // 7天后的日期
daysBetween('2024-01-01', '2024-01-15');  // 14
```

### 安全解析工具

```typescript
import { safeParseFloat, safeParseInt } from '$lib/utils';

safeParseFloat('123.45');     // 123.45
safeParseFloat('invalid');    // 0
safeParseFloat(null, 100);    // 100
safeParseInt('123.9');        // 123
```

---

## 表单 Composables

### useOrderForm

位置: `lib/composables/useOrderForm.ts`

订单表单的通用逻辑封装，用于采购订单和销售订单。

```typescript
<script lang="ts">
import { useOrderForm } from '$lib';

interface Props {
    supplierId: number;
    initialData?: Partial<OrderFormData>;
}

let { supplierId, initialData }: Props = $props();

const {
    // 状态
    formData,
    errors,
    itemErrors,
    currentItem,
    
    // 计算属性
    subtotal,
    taxAmount,
    totalAmount,
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
} = useOrderForm(supplierId, initialData);

// 添加明细
function handleAddItem() {
    if (addItem()) {
        // 添加成功
    }
}

// 提交表单
function handleSubmit() {
    if (validate()) {
        const submitData = prepareSubmitData();
        // 发送 API 请求
    }
}
</script>
```

**返回值说明:**

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `formData` | `OrderFormData` | 表单数据状态 |
| `errors` | `OrderFormErrors` | 表单级错误 |
| `itemErrors` | `OrderItemErrors` | 明细项错误 |
| `currentItem` | `Partial<OrderFormItem>` | 当前正在添加的明细 |
| `subtotal` | `number` | 商品小计（自动计算） |
| `taxAmount` | `number` | 税额（自动计算） |
| `totalAmount` | `number` | 订单总计（自动计算） |
| `priorityOptions` | `Array` | 优先级选项 |
| `validate()` | `() => boolean` | 验证表单 |
| `validateItem()` | `() => boolean` | 验证当前明细 |
| `addItem()` | `() => boolean` | 添加明细到列表 |
| `removeItem(index)` | `(index) => void` | 删除明细 |
| `updateItemField(index, field, value)` |  | 更新明细字段 |
| `setCurrentItemQuotation(quotation)` |  | 设置当前明细的报价 |
| `prepareSubmitData()` | `() => Record<string, unknown>` | 准备提交数据 |

### useOrderItemSelector

用于管理可选订单明细项的选择状态。

```typescript
<script lang="ts">
import { useOrderItemSelector } from '$lib';

const {
    availableItems,
    selectedIds,
    displayableItems,  // 已过滤掉已选择的
    selectItem,
    deselectItem,
    clearSelection,
    setAvailableItems,
} = useOrderItemSelector<SalesOrderItem>();

// 加载可用明细
setAvailableItems(orderItems);

// 选择明细
selectItem(orderItem);

// 取消选择
deselectItem(orderItem.id);
</script>
```

---

## 使用示例

### 创建新的订单表单组件

```svelte
<!-- MyOrderForm.svelte -->
<script lang="ts">
import { useOrderForm } from '$lib';
import type { OrderFormData } from '$lib';

interface Props {
    partnerId: number;
    onSubmit: (data: Record<string, unknown>) => void;
}

let { partnerId, onSubmit }: Props = $props();

const {
    formData,
    errors,
    subtotal,
    taxAmount,
    totalAmount,
    validate,
    prepareSubmitData
} = useOrderForm(partnerId);

function handleSubmit() {
    if (validate()) {
        onSubmit(prepareSubmitData());
    }
}
</script>

<form onsubmit={handleSubmit}>
    <!-- 表单字段 -->
    <div>
        <label>下单日期</label>
        <input type="date" bind:value={formData.order_date} />
        {#if errors.order_date}
            <span class="error">{errors.order_date}</span>
        {/if}
    </div>
    
    <!-- 金额汇总 -->
    <div class="summary">
        <div>小计: ¥{subtotal.toFixed(2)}</div>
        <div>税额: ¥{taxAmount.toFixed(2)}</div>
        <div>总计: ¥{totalAmount.toFixed(2)}</div>
    </div>
    
    <button type="submit">提交</button>
</form>
```

---

## 代码统计

### 新增的可复用代码

| 文件 | 代码行数 | 说明 |
|------|----------|------|
| `api/base.ts` | ~180行 | API 基类 |
| `api/client.ts` | ~130行 | HTTP 客户端 |
| `types/common.ts` | ~150行 | 通用类型定义 |
| `utils/validation.ts` | ~200行 | 验证工具 |
| `utils/formatters.ts` | ~180行 | 格式化工具 |
| `composables/useOrderForm.ts` | ~280行 | 订单表单逻辑 |

### API 重构统计

| API | 原有代码 | 重构后 | 减少比例 |
|-----|---------|--------|----------|
| SupplierAPI | ~80行 | ~40行 | 50% |
| PurchaseOrderAPI | ~120行 | ~50行 | 58% |
| CustomerAPI | ~90行 | ~40行 | 56% |
| SalesOrderAPI | ~110行 | ~50行 | 55% |

---

## 迁移指南

### 从旧 API 迁移到新 API

旧代码:
```typescript
import { supplierAPI } from '$lib/api';
```

新代码（无需更改）:
```typescript
import { supplierAPI } from '$lib';
// 或
import { supplierAPI } from '$lib/api';
```

### 使用新的工具函数

```typescript
// 旧的验证方式
function validate() {
    if (!formData.name) {
        errors.name = '名称不能为空';
        return false;
    }
    if (formData.name.length < 2) {
        errors.name = '最少2个字符';
        return false;
    }
}

// 新的验证方式
import { required, minLength, combine } from '$lib/utils';

const validateName = combine(required(), minLength(2));
const error = validateName(formData.name);
```

---

## 最佳实践

1. **优先使用基类**: 创建新的 API 时，优先继承 `BaseAPI` 或 `BaseOrderAPI`
2. **复用表单逻辑**: 订单类表单优先使用 `useOrderForm` composable
3. **统一验证**: 使用验证工具函数保持验证逻辑一致
4. **类型安全**: 充分利用通用类型定义，避免重复定义
