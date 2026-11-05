# 已有居中弹窗统一重构设计

## 目标

统一前端所有已有居中弹窗的容器样式、关闭语义、焦点管理、键盘行为、滚动锁定和响应式布局，同时保留各业务弹窗自己的表单、数据、校验和 loading 状态。

本阶段不替换业务弹窗状态，也不把表单类弹窗迁入全局 Promise 队列。

## 当前范围

扫描 `fixed inset-0` 居中遮罩后，基线为 28 处已有弹窗，分布在 25 个文件：

- 16 个独立 `*Modal.svelte` 组件
- 12 个页面或管理组件中的内联遮罩弹窗
- 新增的全局 `DialogHost` 不计入“已有弹窗”，但应作为最终统一容器的一部分重构

主要差异：

- 遮罩使用 `bg-black/40` 或 `bg-black/50`
- 部分弹窗有 `p-4` 或 `p-8`，部分没有安全边距
- 宽度和最大高度不统一
- 部分组件缺少 `role="dialog"` 或 `aria-modal="true"`
- ESC 有的绑定在窗口，有的绑定在不可聚焦的遮罩 div
- 没有统一的焦点进入、Tab 焦点循环和关闭后焦点恢复
- 关闭按钮、页头和页脚间距不完全一致
- 有脏表单的弹窗各自实现关闭保护

## 架构

新增一个可复用的 `BaseModal` 和共享交互工具：

1. `BaseModal` 统一遮罩、容器、页头、内容、页脚、尺寸和响应式行为。
2. `useModalInteraction` 统一 scroll lock、Escape、焦点进入、Tab 循环和关闭后焦点恢复。
3. 业务弹窗只保留自己的状态和内容，通过 snippets 提供标题、正文和页脚。

`BaseModal` 接收统一的关闭策略：

```ts
type ModalCloseReason = 'close-button' | 'backdrop' | 'escape';

interface BaseModalProps {
  open: boolean;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  busy?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  canDismiss?: () => boolean;
  onClose: (reason: ModalCloseReason) => void;
}
```

默认尺寸与布局：

- `sm`: 最大宽度 `28rem`
- `md`: 最大宽度 `32rem`
- `lg`: 最大宽度 `42rem`
- `xl`: 最大宽度 `56rem`
- `full`: 宽度接近视口但仍保留安全边距
- 所有尺寸统一 `max-height: 90vh` 和内部滚动
- 统一 `bg-black/50` 遮罩、`p-4` 安全边距和圆角阴影

## 交互规范

- 只有最上层弹窗响应 Escape。
- `busy=true` 时禁止关闭按钮、遮罩和 Escape 关闭。
- 默认点击遮罩关闭；可通过属性关闭此行为。
- 打开时记录当前焦点并聚焦弹窗容器。
- Tab 和 Shift+Tab 在弹窗可聚焦元素之间循环。
- 关闭后焦点恢复到打开前的元素。
- 多个弹窗叠加时使用全局计数锁定页面滚动，最后一层关闭时恢复。
- 关闭原因传给业务组件，供脏表单保护逻辑判断。

## 迁移策略

先建立基础设施并迁移通用弹窗，再迁移专用组件，最后处理页面内联弹窗。

通用弹窗：

- `ConfirmModal.svelte`
- `ErrorModal.svelte`
- `DeleteConfirmModal.svelte`
- `DialogHost.svelte`

专用组件弹窗：

- 物品组装、拆分、出库、调拨、批量分类
- 订单同步、收货
- 发货同步、包裹关联
- 报价调价、物流单详情

内联弹窗：

- 客户地址管理
- 包裹分配错误、物品变体管理、外部链接添加
- 批量编辑表格
- 包裹列表和详情、发货列表、物流单页面

## 兼容性

- 不改变现有组件的公开 props，除非新增属性有默认值。
- 不改变业务流程、表单字段和 API 请求。
- 保留 `shouldDismissModal` 等现有脏表单语义，并由 `BaseModal` 统一调用。
- 保留各弹窗自己的 loading 和异步操作状态。

## 验收

- 全量扫描不再发现未使用 `BaseModal` 的 `fixed inset-0` 居中弹窗。
- 每个弹窗均具备 `role="dialog"`、`aria-modal="true"` 和可读标题。
- Escape、遮罩、关闭按钮、焦点循环和焦点恢复行为一致。
- 手机视口下弹窗保留安全边距，并在内容超高时内部滚动。
- `bun test`、`bun run check` 和 `bun run build` 全部通过。
