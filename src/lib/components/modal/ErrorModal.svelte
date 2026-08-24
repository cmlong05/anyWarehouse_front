<!-- 错误提示弹窗（单按钮） -->
<script lang="ts">
    interface Props {
        message: string | null;
        onClose: () => void;
    }

    let { message, onClose }: Props = $props();

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) onClose();
    }
</script>

{#if message}
    <div
        class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabindex="-1"
        aria-label="关闭弹窗"
    >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-[90%]">
            <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                <h3 class="text-gray-900 text-lg font-semibold">操作失败</h3>
                <button
                    class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md transition-all"
                    onclick={onClose}
                >
                    ×
                </button>
            </div>

            <div class="px-6 py-8 text-center">
                <div class="text-5xl mb-4">❌</div>
                <p class="text-gray-600 leading-relaxed break-words">{message}</p>
            </div>

            <div class="flex justify-end px-6 py-4 border-t border-gray-200">
                <button
                    class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                    onclick={onClose}
                >
                    确定
                </button>
            </div>
        </div>
    </div>
{/if}
