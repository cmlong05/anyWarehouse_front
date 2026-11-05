<!-- 删除确认弹窗 -->
<!--
被依赖：
- `lib/components/shipment/index.ts`
- `routes/customer/shipment/[id]/+page.svelte`
-->
<script lang="ts">
    import { BaseModal } from '$lib/components/modal';

    interface Props {
        show: boolean;
        title: string;
        itemName: string;
        deleting: boolean;
        onCancel: () => void;
        onConfirm: () => void;
    }
    
    let { show, title, itemName, deleting, onCancel, onConfirm }: Props = $props();

    $effect(() => {
        if (!show) return;
        
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                if (!deleting) onConfirm();
            } else if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                if (!deleting) onCancel();
            }
        };
        
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });
</script>

<BaseModal
    open={show}
    {title}
    size="sm"
    busy={deleting}
    onClose={onCancel}
>
    <div class="px-6 py-5">
        <p class="break-words text-gray-600">确定要删除"{itemName}"吗？此操作不可撤销。</p>
        <p class="mt-2 text-xs text-gray-400">按 Y 确认，ESC 或 N 取消</p>
    </div>

    {#snippet footer()}
        <div class="flex justify-end gap-3 px-6 py-4">
            <button
                class="cursor-pointer rounded bg-transparent px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-150 ease-in-out hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={onCancel}
                disabled={deleting}
            >
                取消 (N)
            </button>
            <button
                class="cursor-pointer rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 ease-in-out hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={onConfirm}
                disabled={deleting}
            >
                {deleting ? '删除中...' : '确认删除 (Y)'}
            </button>
        </div>
    {/snippet}
</BaseModal>
