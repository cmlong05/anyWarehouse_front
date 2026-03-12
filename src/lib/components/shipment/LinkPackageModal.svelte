<script lang="ts">
    import type { Package } from '$lib/shipmentTypes';

    interface Props {
        show: boolean;
        packages: Package[];
        selectedId: number | null;
        linking: boolean;
        onClose: () => void;
        onLink: () => void;
        onSelect: (id: number) => void;
    }
    
    let { show, packages, selectedId, linking, onClose, onLink, onSelect }: Props = $props();
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) onClose(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 class="font-bold text-lg mb-4">关联已有包裹</h3>
            
            {#if packages.length === 0}
                <div class="text-center py-8 text-gray-500">
                    <p>没有可关联的包裹</p>
                    <p class="text-sm mt-2">所有包裹都已关联到发货单</p>
                </div>
            {:else}
                <p class="text-sm text-gray-500 mb-4">选择要关联到当前发货单的包裹：</p>
                <div class="space-y-2 max-h-96 overflow-y-auto">
                    {#each packages as pkg}
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                               class:bg-blue-50={selectedId === pkg.id}
                               class:border-blue-500={selectedId === pkg.id}>
                            <input 
                                type="radio" 
                                name="selectedPackage"
                                class="w-5 h-5 rounded-full border-2 border-gray-300 cursor-pointer checked:border-blue-600 checked:bg-blue-600 mr-3"
                                checked={selectedId === pkg.id}
                                onchange={() => onSelect(pkg.id)}
                            />
                            <div class="flex-1">
                                <div class="font-medium">{pkg.package_no}</div>
                                <div class="text-sm text-gray-500">
                                    {#if pkg.tracking_number_detail}
                                        {pkg.tracking_number_detail.carrier_name} - {pkg.tracking_number_detail.tracking_no}
                                    {:else}
                                        未关联快递单号
                                    {/if}
                                    {#if pkg.shipments && pkg.shipments.length > 0}
                                        <span class="ml-2 text-orange-500">(已关联 {pkg.shipments.length} 个发货单)</span>
                                    {:else}
                                        <span class="ml-2 text-green-500">(未关联)</span>
                                    {/if}
                                </div>
                            </div>
                        </label>
                    {/each}
                </div>
            {/if}
            
            <div class="flex justify-end gap-3 mt-6">
                <button 
                    class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 ease-in-out bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed" 
                    onclick={onClose}
                >
                    取消
                </button>
                <button 
                    class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 ease-in-out bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed" 
                    onclick={onLink} 
                    disabled={linking || !selectedId || packages.length === 0}
                >
                    {linking ? '关联中...' : '关联到发货单'}
                </button>
            </div>
        </div>
    </div>
{/if}
