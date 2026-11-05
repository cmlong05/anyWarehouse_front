<!-- 错误提示弹窗（单按钮） -->
<script lang="ts">
    import { BaseModal } from '$lib/components/modal';

    interface Props {
        message: string | null;
        onClose: () => void;
    }

    let { message, onClose }: Props = $props();

</script>

<BaseModal open={!!message} title="操作失败" size="sm" {onClose}>
    <div class="px-6 py-8 text-center">
        <div class="mb-4 text-5xl">❌</div>
        <p class="break-words leading-relaxed text-gray-600">{message}</p>
    </div>

    {#snippet footer()}
        <div class="flex justify-end px-6 py-4">
            <button
                class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                onclick={onClose}
            >
                确定
            </button>
        </div>
    {/snippet}
</BaseModal>
