<!-- 表单字段 -->
<script lang="ts">
    /**
     * 通用表单字段组件
     * 提供标签、错误提示和统一样式的包装
     */
    interface Props {
        label: string;
        for?: string;
        required?: boolean;
        error?: string;
        fullWidth?: boolean;
        class?: string;
        children?: import('svelte').Snippet;
    }
    
    let { 
        label, 
        for: htmlFor,
        required = false,
        error = '',
        fullWidth = false,
        class: className = '',
        children
    }: Props = $props();
</script>

<div class="flex flex-col gap-1 {className}" class:col-span-full={fullWidth}>
    <label for={htmlFor} class="text-sm font-medium text-gray-700">
        {label}
        {#if required}
            <span class="text-red-600 ml-1">*</span>
        {/if}
    </label>
    <div class={error ? '[&_input]:border-red-600 [&_input]:focus:border-red-600 [&_input]:focus:ring-2 [&_input]:focus:ring-red-600/20 [&_select]:border-red-600 [&_select]:focus:border-red-600 [&_select]:focus:ring-2 [&_select]:focus:ring-red-600/20 [&_textarea]:border-red-600 [&_textarea]:focus:border-red-600 [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-red-600/20' : ''}>
        {@render children?.()}
    </div>
    {#if error}
        <span class="text-red-600 text-xs mt-1">{error}</span>
    {/if}
</div>
