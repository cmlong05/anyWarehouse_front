<script lang="ts">
    import PackageForm from '$lib/components/PackageForm.svelte';
    import type { Package } from '$lib/shipmentTypes';

    interface Props {
        show: boolean;
        shipmentId: number;
        onClose: () => void;
        onSuccess: () => void;
    }
    
    let { show, shipmentId, onClose, onSuccess }: Props = $props();

    function handleSuccess(pkg: Package) {
        onSuccess();
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) onClose(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <!-- 头部 -->
            <div class="flex justify-between items-center px-6 py-4 border-b">
                <h3 class="font-bold text-lg">新建包裹</h3>
                <button class="text-gray-400 hover:text-gray-600" onclick={onClose} aria-label="关闭">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <!-- 使用 PackageForm -->
            <PackageForm 
                mode="create" 
                initialShipmentId={shipmentId}
                onSuccess={handleSuccess}
                onCancel={onClose}
            />
        </div>
    </div>
{/if}
