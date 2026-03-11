<script lang="ts">
    interface Props {
        id?: string;
        name?: string;
        value?: number | undefined;
        min?: number;
        max?: number;
        step?: number;
        decimalPlaces?: number;
        placeholder?: string;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        class?: string;
        onchange?: (value: number | undefined) => void;
    }
    
    let {
        id,
        name,
        value = $bindable(undefined),
        min = 0,
        max,
        step = 1,
        decimalPlaces = 2,
        placeholder = '-',
        disabled = false,
        size = 'md',
        class: className = '',
        onchange,
    }: Props = $props();
    
    const sizeClass = $derived({
        sm: 'stepper-sm',
        md: '',
        lg: 'stepper-lg',
    }[size]);
    
    // 输入框的显示值（允许临时编辑）
    let inputValue = $state('');
    // 是否正在编辑
    let isEditing = $state(false);
    
    // 格式化值用于显示
    function formatValue(val: number | undefined): string {
        if (val === undefined || val === null) return '';
        return Number(val).toFixed(decimalPlaces);
    }
    
    // 同步外部 value 到 inputValue（非编辑状态）
    $effect(() => {
        if (!isEditing) {
            inputValue = formatValue(value);
        }
    });
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const rawValue = target.value;
        inputValue = rawValue;
        
        const val = rawValue === '' ? undefined : parseFloat(rawValue);
        value = val;
        onchange?.(val);
    }
    
    function handleFocus() {
        isEditing = true;
        // 聚焦时，如果有值，移除末尾的0，方便编辑
        if (value !== undefined && value !== null) {
            // 将显示值转为普通数字字符串，方便编辑
            inputValue = String(value);
        }
    }
    
    function handleBlur() {
        isEditing = false;
        // 失焦时格式化
        inputValue = formatValue(value);
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
        // 无论是否在编辑状态，都立即更新显示值，避免鼠标滚轮时延迟
        inputValue = formatValue(newVal);
    }
    
    function increment() {
        if (disabled) return;
        const current = value ?? 0;
        const newVal = current + step;
        if (max !== undefined && newVal > max) return;
        value = newVal;
        onchange?.(newVal);
        // 无论是否在编辑状态，都立即更新显示值，避免鼠标滚轮时延迟
        inputValue = formatValue(newVal);
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
        {id}
        {name}
        type="number"
        class="stepper-input"
        value={inputValue}
        {min}
        {max}
        {step}
        {placeholder}
        {disabled}
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
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
