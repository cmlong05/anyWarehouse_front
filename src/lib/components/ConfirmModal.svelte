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
        class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === 'Escape' && !loading && onCancel?.()}
        role="button"
        tabindex="-1"
        aria-label="关闭弹窗"
    >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-[90%]">
            <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                <h3 class="text-gray-900 text-lg font-semibold">{title}</h3>
                {#if !loading}
                    <button 
                        class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md transition-all" 
                        onclick={handleCancel}
                    >
                        ×
                    </button>
                {/if}
            </div>
            
            <div class="px-6 py-8 text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <p class="text-gray-600 mb-3 leading-relaxed">{message}</p>
                {#if itemName}
                    <p class="text-gray-900 font-semibold text-lg break-words">"{itemName}"</p>
                {/if}
            </div>
            
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button 
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2" 
                    onclick={handleCancel}
                    disabled={loading}
                >
                    {cancelText}
                </button>
                <button 
                    class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2" 
                    onclick={handleConfirm}
                    disabled={loading}
                >
                    {#if loading}
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        删除中...
                    {:else}
                        {confirmText}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
