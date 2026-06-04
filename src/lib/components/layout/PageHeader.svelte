<!-- 页面标题区 -->
<!--
  页面头部组件
  
  提供统一的页面标题和操作按钮区域
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** 页面标题 */
    title: string;
    /** 副标题/描述 */
    subtitle?: string;
    /** 左侧额外内容 */
    left?: Snippet;
    /** 右侧操作按钮 */
    actions?: Snippet;
    /** 底部额外内容 */
    bottom?: Snippet;
    /** 底部边距 */
    mb?: 'none' | 'sm' | 'md' | 'lg';
    /** 显示返回按钮 */
    showBack?: boolean;
    /** 返回按钮点击回调 */
    onBack?: () => void;
    /** 额外类名 */
    class?: string;
  }

  let {
    title,
    subtitle = '',
    left,
    actions,
    bottom,
    mb = 'md',
    showBack = false,
    onBack,
    class: className = ''
  }: Props = $props();

  const mbClass = $derived({
    none: 'mb-0',
    sm: 'mb-4',
    md: 'mb-6',
    lg: 'mb-8'
  }[mb]);

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  }
</script>

<div class="flex flex-col gap-4 {mbClass} {className}">
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      {#if showBack}
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          onclick={handleBack}
          aria-label="返回"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      {/if}
      {@render left?.()}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{title}</h1>
        {#if subtitle}
          <p class="text-sm text-gray-500 mt-1">{subtitle}</p>
        {/if}
      </div>
    </div>
    {#if actions}
      <div class="flex items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>
  {#if bottom}
    {@render bottom()}
  {/if}
</div>
