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
</script>

{#if error && errorMessage}
    <div class="alert alert-{variant}" role="alert">
        <div class="alert-content">
            <div class="alert-icon">
                {#if variant === 'error'}
                    ⚠️
                {:else if variant === 'warning'}
                    ⚠️
                {:else}
                    ℹ️
                {/if}
            </div>
            <div class="alert-text">
                <div class="alert-message">{errorMessage}</div>
                {#if errorDetails}
                    <div class="alert-details">{errorDetails}</div>
                {/if}
            </div>
            {#if onDismiss}
                <button 
                    type="button" 
                    class="alert-dismiss" 
                    onclick={onDismiss}
                    aria-label="关闭"
                >
                    ✕
                </button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .alert {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 0.375rem;
        border: 1px solid;
    }
    
    .alert-error {
        background-color: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
    }
    
    .alert-warning {
        background-color: #fffbeb;
        border-color: #fed7aa;
        color: #d97706;
    }
    
    .alert-info {
        background-color: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
    }
    
    .alert-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .alert-icon {
        flex-shrink: 0;
        font-size: 1.25rem;
    }
    
    .alert-text {
        flex: 1;
    }
    
    .alert-message {
        font-weight: 500;
    }
    
    .alert-details {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        opacity: 0.8;
    }
    
    .alert-dismiss {
        flex-shrink: 0;
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        color: inherit;
        opacity: 0.6;
        transition: opacity 0.2s ease;
    }
    
    .alert-dismiss:hover {
        opacity: 1;
    }
</style>
