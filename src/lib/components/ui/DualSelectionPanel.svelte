<!-- 双栏选择面板 -->
<!--
被依赖：
- `lib/components/forms/PackageForm.svelte`
- `lib/components/forms/ShipmentForm.svelte`
-->
<script lang="ts">
    import type { Snippet } from 'svelte';
    
    interface Props {
        availableTitle?: string;
        availableSubtitle?: string;
        selectedTitle?: string;
        selectedSubtitle?: string;
        availableEmptyText?: string;
        selectedEmptyText?: string;
        showAvailable?: boolean;
        showSelected?: boolean;
        layout?: 'horizontal' | 'vertical';
        available?: Snippet;
        selected?: Snippet;
    }
    
    let {
        availableTitle = '📋 可选项目',
        availableSubtitle = '',
        selectedTitle = '📦 已选项目',
        selectedSubtitle = '',
        availableEmptyText = '所有项目已添加',
        selectedEmptyText = '点击左侧"添加"按钮选择项目',
        showAvailable = true,
        showSelected = true,
        layout = 'horizontal',
        available,
        selected
    }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-6 {layout === 'horizontal' ? 'lg:grid-cols-2' : ''}">
    {#if showAvailable}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <h4 class="flex justify-between items-center m-0 mb-4 text-base font-semibold text-gray-700 pb-3 border-b border-gray-200">
                <span>{availableTitle}</span>
                {#if availableSubtitle}
                    <span class="text-xs font-normal text-gray-500">{availableSubtitle}</span>
                {/if}
            </h4>
            <div class="min-h-[200px]">
                {#if available}
                    {@render available()}
                {:else}
                    <div class="text-center p-12 text-gray-400 text-sm">
                        <p>{availableEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    
    {#if showSelected}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <h4 class="flex justify-between items-center m-0 mb-4 text-base font-semibold text-gray-700 pb-3 border-b border-gray-200">
                <span>{selectedTitle}</span>
                {#if selectedSubtitle}
                    <span class="text-xs font-normal text-gray-500">{selectedSubtitle}</span>
                {/if}
            </h4>
            <div class="min-h-[200px]">
                {#if selected}
                    {@render selected()}
                {:else}
                    <div class="text-center p-12 text-gray-400 text-sm">
                        <p>{selectedEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>