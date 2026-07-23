<!-- 物料标签导航 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    export type ItemDetailTab = 'overview' | 'bom' | 'quotations' | 'variants' | 'platforms' | 'associations';

    interface Props {
        activeTab: ItemDetailTab;
        isVariantTemplate: boolean;
        hasVariantTab: boolean;
        variantCount?: number;
        platformLinkCount?: number;
        associationCount?: number;
        onChange: (tab: ItemDetailTab) => void;
    }

    let {
        activeTab,
        isVariantTemplate,
        hasVariantTab,
        variantCount = 0,
        platformLinkCount = 0,
        associationCount = 0,
        onChange,
    }: Props = $props();

    function tabClass(tab: ItemDetailTab, isLast = false): string {
        const base = '!px-4 !py-2 !-mb-px !text-sm !rounded-t-md !rounded-b-none !border !border-b-0 !shadow-none transition-colors';
        const edge = isLast ? '' : ' !-mr-px';
        const active = '!bg-white !border-gray-300 !text-gray-900 !font-medium relative z-10';
        const inactive = '!bg-slate-100 !border-gray-300/70 !text-gray-500 hover:!bg-slate-50 hover:!text-gray-700';
        return `${base}${edge} ${activeTab === tab ? active : inactive}`;
    }
</script>

<div class="flex items-end px-3 pt-2 bg-slate-100 border-b border-gray-300">
    {#if !isVariantTemplate}
        <button type="button" onclick={() => onChange('overview')} class={tabClass('overview')}>
            库存管理
        </button>
    {/if}
    <button type="button" onclick={() => onChange('quotations')} class={tabClass('quotations')}>
        供应商报价
    </button>
    <button type="button" onclick={() => onChange('bom')} class={tabClass('bom')}>
        BOM 组件
    </button>
    {#if hasVariantTab}
        <button type="button" onclick={() => onChange('variants')} class={tabClass('variants')}>
            {isVariantTemplate ? '变体管理' : '变体'}
            {#if variantCount > 0}
                <span class="ml-1.5 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">{variantCount}</span>
            {/if}
        </button>
    {/if}
    <button type="button" onclick={() => onChange('platforms')} class={tabClass('platforms')}>
        销售平台
        {#if platformLinkCount > 0}
            <span class="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">{platformLinkCount}</span>
        {/if}
    </button>
    <button type="button" onclick={() => onChange('associations')} class={tabClass('associations', true)}>
        关联物品
        {#if associationCount > 0}
            <span class="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">{associationCount}</span>
        {/if}
    </button>
</div>