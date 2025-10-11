<script lang="ts">
    interface Props {
        variant?: 'primary' | 'secondary' | 'danger' | 'outline';
        size?: 'small' | 'medium' | 'large';
        disabled?: boolean;
        loading?: boolean;
        type?: 'button' | 'submit' | 'reset';
        href?: string;
        onclick?: () => void;
        children: any;
    }
    
    let {
        variant = 'primary',
        size = 'medium',
        disabled = false,
        loading = false,
        type = 'button',
        href,
        onclick,
        children
    }: Props = $props();
    
    const baseClasses = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    
    const classes = [baseClasses, variantClass, sizeClass].join(' ');
</script>

{#if href}
    <a {href} class={classes} class:disabled>
        {#if loading}
            <span class="btn-spinner"></span>
        {/if}
        {@render children()}
    </a>
{:else}
    <button 
        {type} 
        class={classes} 
        {disabled}
        {onclick}
        class:loading
    >
        {#if loading}
            <span class="btn-spinner"></span>
        {/if}
        {@render children()}
    </button>
{/if}

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 500;
        text-decoration: none;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        line-height: 1.5;
    }
    
    /* Sizes */
    .btn-small {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
    
    .btn-medium {
        padding: 0.5rem 1rem;
        font-size: 1rem;
    }
    
    .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1.125rem;
    }
    
    /* Variants */
    .btn-primary {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }
    
    .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
        border-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
        border-color: #6b7280;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background-color: #4b5563;
        border-color: #4b5563;
    }
    
    .btn-danger {
        background-color: #dc2626;
        color: white;
        border-color: #dc2626;
    }
    
    .btn-danger:hover:not(:disabled) {
        background-color: #b91c1c;
        border-color: #b91c1c;
    }
    
    .btn-outline {
        background-color: transparent;
        color: #3b82f6;
        border-color: #3b82f6;
    }
    
    .btn-outline:hover:not(:disabled) {
        background-color: #3b82f6;
        color: white;
    }
    
    /* States */
    .btn:disabled,
    .btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
    
    .btn.loading {
        pointer-events: none;
    }
    
    .btn-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
