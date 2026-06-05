<!-- 页面容器 -->
<!--
被依赖：
- `lib/components/layout/index.ts`
- `routes/container/[slug]/+page.svelte`
- `routes/container/[slug]/edit/+page.svelte`
- `routes/container/add/+page.svelte`
- `routes/customer/+page.svelte`
- `routes/customer/add/+page.svelte`
- `routes/customer/package/+page.svelte`
- `routes/customer/quotation/[id]/+page.svelte`
- `routes/customer/sales-order/+page.svelte`
- `routes/customer/sales-order/[id]/edit/+page.svelte`
- `routes/customer/sales-order/add/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/item/+page.svelte`
- `routes/item/[slug]/edit/+page.svelte`
- `routes/item/add/+page.svelte`
- `routes/item/attributes/+page.svelte`
- `routes/item/category/[slug]/edit/+page.svelte`
- `routes/item/category/add/+page.svelte`
- `routes/storage/+page.svelte`
- `routes/storage/[slug]/+page.svelte`
- `routes/storage/add/[slug]/+page.svelte`
- `routes/supplier/+page.svelte`
- `routes/supplier/[slug]/+page.svelte`
- `routes/supplier/[slug]/edit/+page.svelte`
- `routes/supplier/add/+page.svelte`
- `routes/supplier/purchase-order/+page.svelte`
- `routes/supplier/purchase-order/add/+page.svelte`
- `routes/supplier/purchase-order/edit/+page.svelte`
- `routes/supplier/quotation/[id]/+page.svelte`
-->
<!--
  页面容器组件
  
  提供统一的页面布局容器，支持最大宽度、内边距等配置
-->
<script lang="ts">
  interface Props {
    /** 最大宽度 */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** 水平内边距 */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** 垂直内边距 */
    py?: 'none' | 'sm' | 'md' | 'lg';
    /** 额外类名 */
    class?: string;
    /** 子元素 */
    children?: import('svelte').Snippet;
  }

  let {
    maxWidth = 'lg',
    padding = 'md',
    py = 'md',
    class: className = '',
    children
  }: Props = $props();

  const maxWidthClass = $derived({
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }[maxWidth]);

  const paddingClass = $derived({
    none: 'px-0',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8'
  }[padding]);

  const pyClass = $derived({
    none: 'py-0',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8'
  }[py]);
</script>

<div class="{maxWidthClass} mx-auto {paddingClass} {pyClass} {className}">
  {@render children?.()}
</div>