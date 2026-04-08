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
        class?: string;
        
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
        class: className = '',
        options,
        value,
        placeholder = '',
        disabled = false,
        onchange
    }: Props = $props();
    
    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        onchange?.(target.value);
    }
</script>

<FormField {label} for={name} {required} {error} {fullWidth} class="min-w-[140px] {className}">
    <select
        id={name}
        {name}
        {value}
        {disabled}
        onchange={handleChange}
        class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 ease-in-out focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 bg-white cursor-pointer appearance-none pr-10"
        style="background-image: url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e&quot;); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em;"
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
