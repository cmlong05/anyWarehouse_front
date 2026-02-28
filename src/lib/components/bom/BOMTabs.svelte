<script lang="ts">
    interface Props {
        activeTab: 'components' | 'tree' | 'total' | 'whereUsed';
        componentsCount: number;
        whereUsedCount: number;
        onChange: (tab: 'components' | 'tree' | 'total' | 'whereUsed') => void;
    }
    
    let { activeTab, componentsCount, whereUsedCount, onChange }: Props = $props();
</script>

<div class="tabs">
    <button
        class="tab-btn"
        class:active={activeTab === 'components'}
        onclick={() => onChange('components')}
    >
        组件列表 ({componentsCount})
    </button>
    <button
        class="tab-btn"
        class:active={activeTab === 'tree'}
        onclick={() => onChange('tree')}
    >
        BOM树
    </button>
    <button
        class="tab-btn"
        class:active={activeTab === 'total'}
        onclick={() => onChange('total')}
    >
        物料汇总
    </button>
    <button
        class="tab-btn"
        class:active={activeTab === 'whereUsed'}
        onclick={() => onChange('whereUsed')}
    >
        被用于 ({whereUsedCount})
    </button>
</div>

<style>
    .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #dee2e6;
        margin-bottom: 1rem;
    }

    .tab-btn {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        color: #6c757d;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        color: #495057;
    }

    .tab-btn.active {
        color: #1976d2;
        border-bottom-color: #1976d2;
        font-weight: 500;
    }

    @media (max-width: 768px) {
        .tabs {
            flex-wrap: wrap;
        }

        .tab-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
        }
    }
</style>
