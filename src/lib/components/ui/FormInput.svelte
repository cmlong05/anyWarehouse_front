<script lang="ts">
    /**
     * 通用文本输入组件
     */
    import FormField from './FormField.svelte';
    
    interface Props {
        // 字段配置
        label: string;
        name: string;
        required?: boolean;
        error?: string;
        fullWidth?: boolean;
        
        // 输入配置
        type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'date';
        value: string | number;
        placeholder?: string;
        disabled?: boolean;
        
        // 验证
        min?: number;
        max?: number;
        step?: number;
        pattern?: string;
        maxlength?: number;
        
        // 事件
        onchange?: (value: string) => void;
        oninput?: (value: string) => void;
        onblur?: () => void;
    }
    
    let { 
        label,
        name,
        required = false,
        error = '',
        fullWidth = false,
        type = 'text',
        value,
        placeholder = '',
        disabled = false,
        min,
        max,
        step,
        pattern,
        maxlength,
        onchange,
        oninput,
        onblur
    }: Props = $props();
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        oninput?.(target.value);
    }
    
    function handleChange(e: Event) {
        const target = e.target as HTMLInputElement;
        onchange?.(target.value);
    }
</script>

<FormField {label} for={name} {required} {error} {fullWidth}>
    <input
        {type}
        id={name}
        {name}
        {value}
        {placeholder}
        {disabled}
        {min}
        {max}
        {step}
        {pattern}
        {maxlength}
        oninput={handleInput}
        onchange={handleChange}
        onblur={onblur}
    />
</FormField>

<style>
    input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: all 0.15s ease;
        width: 100%;
        box-sizing: border-box;
    }
    
    input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    input:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    input::placeholder {
        color: #9ca3af;
    }
</style>
