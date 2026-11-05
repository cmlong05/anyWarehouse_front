<!-- 全部发货明细对齐确认弹窗 -->
<script lang="ts">
    import { BaseModal } from '$lib/components/modal';

    interface Props {
        isOpen?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }

    let {
        isOpen = false,
        onConfirm,
        onCancel
    }: Props = $props();

</script>

<BaseModal
    open={isOpen}
    title="全部明细对齐"
    size="md"
    onClose={() => onCancel?.()}
>
            <div class="px-6 py-5">
                <p class="text-sm leading-relaxed text-gray-600">
                    将发货单全部明细的计划数量对齐到已封箱包裹的实际数量。
                </p>
                <p class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                    未出现在已封箱包裹中的明细，其计划数量会调整为 0；随后可使用“剔除未打包行”清理。
                </p>
            </div>

    {#snippet footer()}
            <div class="flex justify-end gap-3 px-6 py-4">
                <button
                    type="button"
                    class="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    onclick={onCancel}
                >
                    取消
                </button>
                <button
                    type="button"
                    class="rounded-md bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
                    onclick={onConfirm}
                >
                    执行
                </button>
            </div>
    {/snippet}
</BaseModal>
