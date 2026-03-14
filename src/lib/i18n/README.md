# Shipment 发货单国际化 (i18n)

支持中文(zh)和英文(en)双语切换。

## 使用方式

### 1. 基础翻译函数

```typescript
import { t, getStatusText, setLocale, getLocale } from '$lib/i18n/shipment';

// 获取翻译文本
const title = t('shipment.detail.title'); // "发货详情" 或 "Shipment Details"

// 获取状态文本
const status = getStatusText('shipped'); // "已发货" 或 "Shipped"

// 切换语言
setLocale('en'); // 切换到英文
setLocale('zh'); // 切换到中文
```

### 2. Svelte 组件中使用

```svelte
<script>
    import { localeStore, t } from '$lib/i18n/shipment';
    import { LocaleSwitcher } from '$lib/components/shipment';
    
    // 响应式翻译
    $: title = t('shipment.detail.title', $localeStore);
</script>

<!-- 语言切换器 -->
<LocaleSwitcher variant="button" />
<!-- 或 -->
<LocaleSwitcher variant="select" />
<!-- 或 -->
<LocaleSwitcher variant="tabs" />
```

### 3. 在 composable 中使用

```typescript
import { t, getShipmentActions } from '$lib/i18n/shipment';

// 获取当前语言的 actions
const actions = getShipmentActions('en');
```

## 翻译键列表

### 页面标题
- `shipment.list.title`
- `shipment.detail.title`
- `shipment.create.title`
- `shipment.edit.title`
- `shipment.tracking.title`

### 状态
- `shipment.status.draft`
- `shipment.status.confirmed`
- `shipment.status.packed`
- `shipment.status.shipped`
- `shipment.status.delivered`
- `shipment.status.cancelled`
- `shipment.status.synced`

### 按钮
- `shipment.btn.create`
- `shipment.btn.edit`
- `shipment.btn.delete`
- `shipment.btn.confirm`
- `shipment.btn.pack`
- `shipment.btn.ship`
- `shipment.btn.deliver`
- `shipment.btn.cancel`
- `shipment.btn.sync`
- `shipment.btn.save`
- `shipment.btn.cancelEdit`
- `shipment.btn.back`
- `shipment.btn.print`
- `shipment.btn.addItem`
- `shipment.btn.addPackage`
- `shipment.btn.addTracking`

### 表单字段
- `shipment.field.shipmentNumber`
- `shipment.field.orderNumber`
- `shipment.field.customer`
- `shipment.field.status`
- `shipment.field.carrier`
- `shipment.field.trackingNumber`
- `shipment.field.shipDate`
- `shipment.field.deliveryDate`
- `shipment.field.weight`
- `shipment.field.dimensions`
- `shipment.field.notes`
- `shipment.field.createdAt`
- `shipment.field.updatedAt`
- `shipment.field.packageCount`
- `shipment.field.itemCount`
- `shipment.field.totalWeight`
- `shipment.field.totalVolume`

### 包裹
- `shipment.package.title`
- `shipment.package.number`
- `shipment.package.weight`
- `shipment.package.length`
- `shipment.package.width`
- `shipment.package.height`
- `shipment.package.items`

### 物品
- `shipment.item.title`
- `shipment.item.sku`
- `shipment.item.name`
- `shipment.item.quantity`
- `shipment.item.shippedQty`
- `shipment.item.pendingQty`

### 快递单号
- `shipment.tracking.title`
- `shipment.tracking.number`
- `shipment.tracking.carrier`
- `shipment.tracking.status`
- `shipment.tracking.status.available`
- `shipment.tracking.status.used`
- `shipment.tracking.status.reserved`

### 提示信息
- `shipment.msg.confirmDelete`
- `shipment.msg.confirmCancel`
- `shipment.msg.confirmConfirm`
- `shipment.msg.confirmSync`
- `shipment.msg.confirmPack`
- `shipment.msg.confirmShip`
- `shipment.msg.confirmDeliver`
- `shipment.msg.noItems`
- `shipment.msg.noPackages`
- `shipment.msg.noTracking`
- `shipment.msg.createSuccess`
- `shipment.msg.updateSuccess`
- `shipment.msg.deleteSuccess`
- `shipment.msg.statusChangeSuccess`

### 错误信息
- `shipment.error.loadFailed`
- `shipment.error.createFailed`
- `shipment.error.updateFailed`
- `shipment.error.deleteFailed`
- `shipment.error.invalidQuantity`
- `shipment.error.noItems`

## 语言持久化

语言设置会自动保存到 localStorage，键名为 `shipment-locale`。

## 扩展其他语言

如需添加更多语言，修改 `shipment.ts` 中的 `shipmentTranslations`：

```typescript
export const shipmentTranslations = {
    zh: { ... },
    en: { ... },
    ja: {  // 添加日语
        'shipment.list.title': '出荷管理',
        ...
    }
};
```

并更新类型：
```typescript
export type Locale = 'zh' | 'en' | 'ja';
```
