<script lang="ts">
    interface Props {
        size?: 'small' | 'medium' | 'large';
        text?: string;
        inline?: boolean;
    }
    
    let { 
        size = 'medium',
        text = '加载中...',
        inline = false
    }: Props = $props();
</script>

<div class="loading" class:loading-inline={inline}>
    <div class="spinner spinner-{size}"></div>
    {#if text}
        <span class="loading-text">{text}</span>
    {/if}
</div>

<style>
    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem;
    }
    
    .loading-inline {
        flex-direction: row;
        padding: 0.5rem;
        gap: 0.5rem;
    }
    
    .spinner {
        border-radius: 50%;
        border: 2px solid #f3f4f6;
        border-top: 2px solid #3b82f6;
        animation: spin 1s linear infinite;
    }
    
    .spinner-small {
        width: 1rem;
        height: 1rem;
    }
    
    .spinner-medium {
        width: 2rem;
        height: 2rem;
    }
    
    .spinner-large {
        width: 3rem;
        height: 3rem;
    }
    
    .loading-text {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
