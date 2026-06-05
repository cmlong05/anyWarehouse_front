<!-- BOM标签页 -->
<!--
被依赖：
- `lib/components/ItemComponentManager.svelte`
- `lib/components/bom/index.ts`
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        activeTab: 'components' | 'tree' | 'total' | 'whereUsed';
        componentsCount: number;
        whereUsedCount: number;
        onChange: (tab: 'components' | 'tree' | 'total' | 'whereUsed') => void;
        actions?: Snippet;
    }
    
    let { activeTab, componentsCount, whereUsedCount, onChange, actions }: Props = $props();
</script>

<div class="flex items-end justify-between px-3 pt-2 bg-slate-100 border-b border-gray-300 mb-4 gap-3">
    <div class="flex flex-wrap items-end min-w-0">
        <button
            type="button"
            class="!px-4 !py-2 !-mb-px !-mr-px !text-sm !rounded-t-md !rounded-b-none !border !border-b-0 !shadow-none transition-colors cursor-pointer {activeTab === 'components' ? '!bg-white !border-gray-300 !text-gray-900 !font-medium relative z-10' : '!bg-slate-100 !border-gray-300/70 !text-gray-500 hover:!bg-slate-50 hover:!text-gray-700'}"
            onclick={() => onChange('components')}
        >
            组件列表 ({componentsCount})
        </button>
        <button
            type="button"
            class="!px-4 !py-2 !-mb-px !-mr-px !text-sm !rounded-t-md !rounded-b-none !border !border-b-0 !shadow-none transition-colors cursor-pointer {activeTab === 'tree' ? '!bg-white !border-gray-300 !text-gray-900 !font-medium relative z-10' : '!bg-slate-100 !border-gray-300/70 !text-gray-500 hover:!bg-slate-50 hover:!text-gray-700'}"
            onclick={() => onChange('tree')}
        >
            BOM树
        </button>
        <button
            type="button"
            class="!px-4 !py-2 !-mb-px !-mr-px !text-sm !rounded-t-md !rounded-b-none !border !border-b-0 !shadow-none transition-colors cursor-pointer {activeTab === 'total' ? '!bg-white !border-gray-300 !text-gray-900 !font-medium relative z-10' : '!bg-slate-100 !border-gray-300/70 !text-gray-500 hover:!bg-slate-50 hover:!text-gray-700'}"
            onclick={() => onChange('total')}
        >
            物料汇总
        </button>
        <button
            type="button"
            class="!px-4 !py-2 !-mb-px !text-sm !rounded-t-md !rounded-b-none !border !border-b-0 !shadow-none transition-colors cursor-pointer {activeTab === 'whereUsed' ? '!bg-white !border-gray-300 !text-gray-900 !font-medium relative z-10' : '!bg-slate-100 !border-gray-300/70 !text-gray-500 hover:!bg-slate-50 hover:!text-gray-700'}"
            onclick={() => onChange('whereUsed')}
        >
            被用于 ({whereUsedCount})
        </button>
    </div>
    <div class="flex items-center pb-2 shrink-0">
        {@render actions?.()}
    </div>
</div>