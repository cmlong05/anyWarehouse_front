<script lang="ts">
    export interface ErrorInfo {
        message: string;
        code?: string;
        details?: string;
    }
    
    interface Props {
        error?: ErrorInfo | string | null;
        onDismiss?: () => void;
        variant?: 'error' | 'warning' | 'info';
    }
    
    let { 
        error, 
        onDismiss,
        variant = 'error'
    }: Props = $props();
    
    const errorMessage = $derived(typeof error === 'string' ? error : error?.message);
    const errorDetails = $derived(typeof error === 'object' ? error?.details : undefined);
    
    const variantClasses = {
        error: 'bg-red-50 border-red-200 text-red-600',
        warning: 'bg-amber-50 border-amber-200 text-amber-600',
        info: 'bg-blue-50 border-blue-200 text-blue-600'
    };
</script>

{#if error && errorMessage}
    <div class="p-4 mb-4 rounded-md border {variantClasses[variant]}" role="alert">
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 text-xl">
                {#if variant === 'error'}
                    ⚠️
                {:else if variant === 'warning'}
                    ⚠️
                {:else}
                    ℹ️
                {/if}
            </div>
            <div class="flex-1">
                <div class="font-medium">{errorMessage}</div>
                {#if errorDetails}
                    <div class="mt-1 text-sm opacity-80">{errorDetails}</div>
                {/if}
            </div>
            {#if onDismiss}
                <button 
                    type="button" 
                    class="flex-shrink-0 text-xl opacity-60 hover:opacity-100 transition-opacity" 
                    onclick={onDismiss}
                    aria-label="关闭"
                >
                    ✕
                </button>
            {/if}
        </div>
    </div>
{/if}
