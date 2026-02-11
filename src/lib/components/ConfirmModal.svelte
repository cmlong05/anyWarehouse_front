<script lang="ts">
    interface Props {
        isOpen?: boolean;
        title?: string;
        message?: string;
        itemName?: string;
        confirmText?: string;
        cancelText?: string;
        loading?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }
    
    let {
        isOpen = false,
        title = '确认删除',
        message = '确定要删除以下项目吗？此操作不可撤销。',
        itemName = '',
        confirmText = '删除',
        cancelText = '取消',
        loading = false,
        onConfirm,
        onCancel
    }: Props = $props();
    
    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget && !loading) {
            onCancel?.();
        }
    }
    
    function handleConfirm() {
        onConfirm?.();
    }
    
    function handleCancel() {
        onCancel?.();
    }
</script>

{#if isOpen}
    <div 
        class="modal-backdrop" 
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === 'Escape' && !loading && onCancel?.()}
        role="button"
        tabindex="-1"
        aria-label="关闭弹窗"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h3>{title}</h3>
                {#if !loading}
                    <button class="close-btn" onclick={handleCancel}>×</button>
                {/if}
            </div>
            
            <div class="modal-body">
                <div class="warning-icon">⚠️</div>
                <p class="message">{message}</p>
                {#if itemName}
                    <p class="item-name">"{itemName}"</p>
                {/if}
            </div>
            
            <div class="modal-footer">
                <button 
                    class="btn btn-secondary" 
                    onclick={handleCancel}
                    disabled={loading}
                >
                    {cancelText}
                </button>
                <button 
                    class="btn btn-danger" 
                    onclick={handleConfirm}
                    disabled={loading}
                >
                    {#if loading}
                        <span class="loading-spinner"></span>
                        删除中...
                    {:else}
                        {confirmText}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 450px;
        width: 90%;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
        margin: 0;
        color: #1f2937;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.15s ease;
    }

    .close-btn:hover {
        background-color: #f3f4f6;
        color: #374151;
    }

    .modal-body {
        padding: 2rem 1.5rem;
        text-align: center;
    }

    .warning-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .message {
        margin: 0 0 0.75rem 0;
        color: #4b5563;
        line-height: 1.5;
    }

    .item-name {
        margin: 0;
        color: #1f2937;
        font-weight: 600;
        font-size: 1.1rem;
        word-break: break-word;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #e5e7eb;
    }

    .btn-danger {
        background-color: #dc2626;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #b91c1c;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }

        .modal-header,
        .modal-body,
        .modal-footer {
            padding: 1rem;
        }

        .modal-footer {
            flex-direction: column-reverse;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>
