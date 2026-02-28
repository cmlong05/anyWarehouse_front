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

<div class="form-field {className}" class:full-width={fullWidth} class:error={!!error}>
    <label for={htmlFor}>
        {label}
        {#if required}
            <span class="required-mark">*</span>
        {/if}
    </label>
    {@render children?.()}
    {#if error}
        <span class="error-message">{error}</span>
    {/if}
</div>

<style>
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .form-field.full-width {
        grid-column: 1 / -1;
    }
    
    .form-field label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    .required-mark {
        color: #dc2626;
        margin-left: 0.25rem;
    }
    
    .error-message {
        color: #dc2626;
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }
    
    .form-field.error :global(input),
    .form-field.error :global(select),
    .form-field.error :global(textarea) {
        border-color: #dc2626;
    }
    
    .form-field.error :global(input:focus),
    .form-field.error :global(select:focus),
    .form-field.error :global(textarea:focus) {
        border-color: #dc2626;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
</style>
