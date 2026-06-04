<!-- 表单输入框 -->
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
        class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 ease-in-out focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 placeholder:text-gray-400"
    />
</FormField>
