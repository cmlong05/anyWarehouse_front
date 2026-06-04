<!-- 筛选面板 -->
<script lang="ts">
    /**
     * 通用筛选面板组件 - TailwindCSS 版本
     */
    import type { Snippet } from 'svelte';
    
    interface Props {
        children: Snippet;
        onApply?: () => void;
        onReset?: () => void;
        applyText?: string;
        resetText?: string;
        showActions?: boolean;
    }
    
    let {
        children,
        onApply,
        onReset,
        applyText = '应用筛选',
        resetText = '重置',
        showActions = true
    }: Props = $props();
</script>

<div class="bg-gray-50 p-4 rounded-lg mb-6">
    <div class="flex flex-wrap items-end gap-4">
        {@render children()}
        
        {#if showActions}
            <div class="flex gap-2">
                {#if onReset}
                    <button 
                        type="button"
                        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        onclick={onReset}
                    >
                        {resetText}
                    </button>
                {/if}
                {#if onApply}
                    <button 
                        type="button"
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        onclick={onApply}
                    >
                        {applyText}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
