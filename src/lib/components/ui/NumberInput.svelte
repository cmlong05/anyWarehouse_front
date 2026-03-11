<script lang="ts">
    interface Props {
        value?: number | undefined;
        min?: number;
        max?: number;
        step?: number;
        placeholder?: string;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        class?: string;
        onchange?: (value: number | undefined) => void;
        onclick?: (e: MouseEvent) => void;
    }
    
    let {
        value = $bindable(undefined),
        min,
        max,
        step = 1,
        placeholder = '-',
        disabled = false,
        size = 'md',
        class: className = '',
        onchange,
        onclick,
    }: Props = $props();
    
    const sizeClass = $derived({
        sm: 'input-number-sm',
        md: '',
        lg: 'input-number-lg',
    }[size]);
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = target.value === '' ? undefined : parseFloat(target.value);
        value = val;
        onchange?.(val);
    }
</script>

<input
    type="number"
    class="input-number {sizeClass} {className}"
    {value}
    {min}
    {max}
    {step}
    {placeholder}
    {disabled}
    oninput={handleInput}
    onclick={onclick}
/>
