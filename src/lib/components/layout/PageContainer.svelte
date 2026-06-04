<!-- 页面容器 -->
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
