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
    }
    
    let {
        value = $bindable(undefined),
        min = 0,
        max,
        step = 1,
        placeholder = '-',
        disabled = false,
        size = 'md',
        class: className = '',
        onchange,
    }: Props = $props();
    
    const sizeClass = {
        sm: 'stepper-sm',
        md: '',
        lg: 'stepper-lg',
    }[size];
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = target.value === '' ? undefined : parseFloat(target.value);
        value = val;
        onchange?.(val);
    }
    
    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        if (disabled) return;
        if (e.deltaY < 0) {
            increment();
        } else {
            decrement();
        }
    }
    
    function decrement() {
        if (disabled) return;
        const current = value ?? 0;
        const newVal = current - step;
        if (newVal < min) return;
        value = newVal;
        onchange?.(newVal);
    }
    
    function increment() {
        if (disabled) return;
        const current = value ?? 0;
        const newVal = current + step;
        if (max !== undefined && newVal > max) return;
        value = newVal;
        onchange?.(newVal);
    }
</script>

<div class="number-stepper {sizeClass} {className}" class:disabled>
    <button 
        type="button" 
        class="stepper-btn stepper-minus"
        {disabled}
        onclick={decrement}
        aria-label="减少"
    >
        −
    </button>
    <input
        type="number"
        class="stepper-input"
        {value}
        {min}
        {max}
        {step}
        {placeholder}
        {disabled}
        oninput={handleInput}
        onwheel={handleWheel}
    />
    <button 
        type="button" 
        class="stepper-btn stepper-plus"
        {disabled}
        onclick={increment}
        aria-label="增加"
    >
        +
    </button>
</div>
