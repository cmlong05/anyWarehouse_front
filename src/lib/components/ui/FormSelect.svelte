<script lang="ts">
    /**
     * 通用选择框组件
     */
    import FormField from './FormField.svelte';
    
    interface Option {
        value: string;
        label: string;
        disabled?: boolean;
    }
    
    interface Props {
        // 字段配置
        label: string;
        name: string;
        required?: boolean;
        error?: string;
        fullWidth?: boolean;
        
        // 选项配置
        options: Option[];
        value: string;
        placeholder?: string;
        disabled?: boolean;
        
        // 事件
        onchange?: (value: string) => void;
    }
    
    let { 
        label,
        name,
        required = false,
        error = '',
        fullWidth = false,
        options,
        value,
        placeholder = '请选择',
        disabled = false,
        onchange
    }: Props = $props();
    
    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        onchange?.(target.value);
    }
</script>

<FormField {label} for={name} {required} {error} {fullWidth}>
    <select
        id={name}
        {name}
        {value}
        {disabled}
        onchange={handleChange}
    >
        {#if placeholder}
            <option value="" disabled selected={!value}>{placeholder}</option>
        {/if}
        {#each options as option}
            <option value={option.value} disabled={option.disabled}>
                {option.label}
            </option>
        {/each}
    </select>
</FormField>

<style>
    select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: all 0.15s ease;
        width: 100%;
        box-sizing: border-box;
        background-color: white;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }
    
    select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    select:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
        opacity: 0.7;
    }
</style>
