<script lang="ts">
    interface Props {
        show: boolean;
        title: string;
        itemName: string;
        deleting: boolean;
        onCancel: () => void;
        onConfirm: () => void;
    }
    
    let { show, title, itemName, deleting, onCancel, onConfirm }: Props = $props();

    // 键盘事件处理
    $effect(() => {
        if (!show) return;
        
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                if (!deleting) onConfirm();
            } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                onCancel();
            }
        };
        
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) onCancel(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="font-bold text-lg mb-4">{title}</h3>
            <p class="py-2 text-gray-600">确定要删除"{itemName}"吗？此操作不可撤销。</p>
            <p class="text-xs text-gray-400 mt-2">按 Y 确认，ESC 或 N 取消</p>
            <div class="flex justify-end gap-3 mt-6">
                <button 
                    class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 ease-in-out bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed" 
                    onclick={onCancel}
                >
                    取消 (N)
                </button>
                <button 
                    class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 ease-in-out bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed" 
                    onclick={onConfirm} 
                    disabled={deleting}
                >
                    {deleting ? '删除中...' : '确认删除 (Y)'}
                </button>
            </div>
        </div>
    </div>
{/if}
