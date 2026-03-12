<script lang="ts">
    interface Props {
        activeTab: 'components' | 'tree' | 'total' | 'whereUsed';
        componentsCount: number;
        whereUsedCount: number;
        onChange: (tab: 'components' | 'tree' | 'total' | 'whereUsed') => void;
    }
    
    let { activeTab, componentsCount, whereUsedCount, onChange }: Props = $props();
</script>

<div class="flex flex-wrap gap-2 border-b-2 border-gray-200 mb-4">
    <button
        class="px-4 py-3 md:px-3 md:py-2 md:text-sm border-none bg-transparent cursor-pointer text-gray-500 border-b-2 border-transparent -mb-0.5 transition-all duration-200 hover:text-gray-600"
        class:text-blue-600={activeTab === 'components'}
        class:border-b-blue-600={activeTab === 'components'}
        class:font-medium={activeTab === 'components'}
        onclick={() => onChange('components')}
    >
        组件列表 ({componentsCount})
    </button>
    <button
        class="px-4 py-3 md:px-3 md:py-2 md:text-sm border-none bg-transparent cursor-pointer text-gray-500 border-b-2 border-transparent -mb-0.5 transition-all duration-200 hover:text-gray-600"
        class:text-blue-600={activeTab === 'tree'}
        class:border-b-blue-600={activeTab === 'tree'}
        class:font-medium={activeTab === 'tree'}
        onclick={() => onChange('tree')}
    >
        BOM树
    </button>
    <button
        class="px-4 py-3 md:px-3 md:py-2 md:text-sm border-none bg-transparent cursor-pointer text-gray-500 border-b-2 border-transparent -mb-0.5 transition-all duration-200 hover:text-gray-600"
        class:text-blue-600={activeTab === 'total'}
        class:border-b-blue-600={activeTab === 'total'}
        class:font-medium={activeTab === 'total'}
        onclick={() => onChange('total')}
    >
        物料汇总
    </button>
    <button
        class="px-4 py-3 md:px-3 md:py-2 md:text-sm border-none bg-transparent cursor-pointer text-gray-500 border-b-2 border-transparent -mb-0.5 transition-all duration-200 hover:text-gray-600"
        class:text-blue-600={activeTab === 'whereUsed'}
        class:border-b-blue-600={activeTab === 'whereUsed'}
        class:font-medium={activeTab === 'whereUsed'}
        onclick={() => onChange('whereUsed')}
    >
        被用于 ({whereUsedCount})
    </button>
</div>
