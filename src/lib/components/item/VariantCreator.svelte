<!-- 变体创建器 -->
<!--
被依赖：
- `lib/components/item/ItemVariantManager.svelte`
-->
<script lang="ts">
    import { config } from '$lib/config';
    import type { ItemAttribute, ItemAttributeValue, BulkCreateVariantsResponse } from '$lib/types/variant';
    import { NumberStepper } from '$lib/components/ui';

    interface Props {
        parentItemId: number;
        parentItemSku: string;
        onSuccess?: () => void;
        onCancel?: () => void;
    }

    let { parentItemId, parentItemSku, onSuccess, onCancel }: Props = $props();

    // 状态
    let attributes = $state<ItemAttribute[]>([]);
    let attributeValues = $state<ItemAttributeValue[]>([]);
    let loading = $state(false);
    let creating = $state(false);

    // 选择的状态
    let selectedAttributeIds = $state<number[]>([]);
    let selectedValueIds = $state<number[]>([]);

    // 价格设置
    let inheritPrice = $state(true);
    let defaultPrice = $state<string>('');

    // 结果
    let createResult = $state<BulkCreateVariantsResponse | null>(null);
    let error = $state<string | null>(null);

    // 加载属性数据
    async function loadData() {
        loading = true;
        try {
            const [attrRes, valuesRes] = await Promise.all([
                fetch(`${config.API_BASE_URL}/product/attributes/`),
                fetch(`${config.API_BASE_URL}/product/attribute-values/`)
            ]);

            if (attrRes.ok) attributes = await attrRes.json();
            if (valuesRes.ok) attributeValues = await valuesRes.json();
        } catch (e) {
            error = '加载数据失败';
        } finally {
            loading = false;
        }
    }

    // 获取属性的所有值
    function getValuesForAttribute(attributeId: number): ItemAttributeValue[] {
        return attributeValues.filter(v => v.attribute === attributeId && v.is_active);
    }

    // 切换属性选择
    function toggleAttribute(attrId: number) {
        if (selectedAttributeIds.includes(attrId)) {
            selectedAttributeIds = selectedAttributeIds.filter(id => id !== attrId);
            // 同时移除该属性下的所有值选择
            const valueIdsForAttr = getValuesForAttribute(attrId).map(v => v.id);
            selectedValueIds = selectedValueIds.filter(id => !valueIdsForAttr.includes(id));
        } else {
            selectedAttributeIds = [...selectedAttributeIds, attrId];
        }
    }

    // 切换值选择
    function toggleValue(attrId: number, valueId: number) {
        if (selectedValueIds.includes(valueId)) {
            selectedValueIds = selectedValueIds.filter(id => id !== valueId);
        } else {
            // 如果是单选属性（如尺寸），先移除同属性的其他选择
            const valuesForAttr = getValuesForAttribute(attrId);
            const valueIdsForAttr = valuesForAttr.map(v => v.id);
            selectedValueIds = selectedValueIds.filter(id => !valueIdsForAttr.includes(id));
            selectedValueIds = [...selectedValueIds, valueId];
        }
    }

    // 生成所有组合
    function generateCombinations(): number[][] {
        const combinations: number[][] = [];
        
        // 获取每个选中属性的选中值
        const valuesByAttribute = selectedAttributeIds.map(attrId => {
            const values = getValuesForAttribute(attrId);
            return values.filter(v => selectedValueIds.includes(v.id)).map(v => v.id);
        }).filter(arr => arr.length > 0);

        if (valuesByAttribute.length === 0) return [];

        // 笛卡尔积生成所有组合
        function cartesianProduct(arrays: number[][]): number[][] {
            if (arrays.length === 0) return [[]];
            if (arrays.length === 1) return arrays[0].map(v => [v]);
            
            const result: number[][] = [];
            const rest = cartesianProduct(arrays.slice(1));
            for (const value of arrays[0]) {
                for (const combination of rest) {
                    result.push([value, ...combination]);
                }
            }
            return result;
        }

        return cartesianProduct(valuesByAttribute);
    }

    // 创建变体
    async function createVariants() {
        const combinations = generateCombinations();
        
        if (combinations.length === 0) {
            error = '请选择至少一个属性的值';
            return;
        }

        if (combinations.length > 50) {
            error = `将创建 ${combinations.length} 个变体，最多支持50个`;
            return;
        }

        creating = true;
        error = null;
        createResult = null;

        try {
            const response = await fetch(`${config.API_BASE_URL}/product/variants/bulk_create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent_item_id: parentItemId,
                    attribute_value_groups: combinations,
                    inherit_price: inheritPrice,
                    default_price: inheritPrice ? null : (defaultPrice ? parseFloat(defaultPrice) : null)
                })
            });

            if (response.ok) {
                const result = await response.json();
                createResult = result;
                if (result && result.errors.length === 0) {
                    setTimeout(() => {
                        onSuccess?.();
                    }, 1500);
                }
            } else {
                const data = await response.json();
                error = data.error || '创建失败';
            }
        } catch (e) {
            error = '网络错误';
        } finally {
            creating = false;
        }
    }

    // 计算预览
    let previewCombinations = $derived(generateCombinations());
    let previewSkus = $derived(previewCombinations.map(combo => {
        const codes = combo.map(valueId => {
            const value = attributeValues.find(v => v.id === valueId);
            return value?.code.toUpperCase() || '';
        });
        return `${parentItemSku}-${codes.join('-')}`;
    }));

    // 初始化
    $effect(() => {
        loadData();
    });
</script>

<div class="space-y-6">
    {#if loading}
        <div class="text-center py-8 text-gray-500">加载中...</div>
    {:else}
        <!-- 步骤1：选择属性 -->
        <div class="space-y-3">
            <h3 class="font-medium text-gray-900">步骤1：选择要使用的属性</h3>
            {#if attributes.length === 0}
                <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p class="text-sm text-yellow-800">
                        暂无属性定义，请先创建属性
                    </p>
                    <a href="/item/attributes" class="mt-2 inline-block text-sm text-blue-600 hover:underline">
                        → 前往属性管理页面
                    </a>
                </div>
            {:else if attributeValues.length === 0}
                <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p class="text-sm text-yellow-800">
                        属性已创建，但还没有属性值（如：红色、蓝色、M、L等）
                    </p>
                    <a href="/item/attributes" class="mt-2 inline-block text-sm text-blue-600 hover:underline">
                        → 前往属性管理页面添加属性值
                    </a>
                </div>
            {:else}
                <div class="flex flex-wrap gap-2">
                    {#each attributes.filter(a => a.is_active) as attr}
                        {@const valueCount = getValuesForAttribute(attr.id).length}
                        <button
                            onclick={() => toggleAttribute(attr.id)}
                            class="px-3 py-2 text-sm rounded-lg border transition-all {selectedAttributeIds.includes(attr.id)
                                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
                        >
                            {attr.name}
                            <span class="text-xs text-gray-400 ml-1">({valueCount})</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- 步骤2：选择属性值 -->
        {#if selectedAttributeIds.length > 0}
            <div class="space-y-3">
                <h3 class="font-medium text-gray-900">步骤2：选择属性值</h3>
                {#each selectedAttributeIds as attrId}
                    {@const attr = attributes.find(a => a.id === attrId)}
                    {@const values = getValuesForAttribute(attrId)}
                    {#if attr}
                        <div class="bg-gray-50 rounded-lg p-3">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">{attr.name}</h4>
                            {#if values.length === 0}
                                <div class="text-sm text-red-500">
                                    该属性下没有属性值，请先添加
                                    <a href="/item/attributes" class="text-blue-600 hover:underline ml-1">去添加 →</a>
                                </div>
                            {:else}
                                <div class="flex flex-wrap gap-2">
                                    {#each values as value}
                                        <button
                                            onclick={() => toggleValue(attrId, value.id)}
                                            class="px-3 py-1.5 text-sm rounded-lg border transition-all {selectedValueIds.includes(value.id)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
                                        >
                                            {#if value.color_hex}
                                                <span 
                                                    class="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                                                    style="background-color: {value.color_hex}"
                                                ></span>
                                            {/if}
                                            {value.value}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        <!-- 步骤3：价格设置 -->
        {#if selectedValueIds.length > 0}
            <div class="space-y-3">
                <h3 class="font-medium text-gray-900">步骤3：价格设置</h3>
                <div class="bg-gray-50 rounded-lg p-3 space-y-3">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            bind:group={inheritPrice}
                            value={true}
                            class="w-4 h-4 text-blue-600"
                        />
                        <span class="text-sm text-gray-700">继承母版价格</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            bind:group={inheritPrice}
                            value={false}
                            class="w-4 h-4 text-blue-600"
                        />
                        <span class="text-sm text-gray-700">设置统一价格</span>
                    </label>
                    {#if !inheritPrice}
                        <div class="pl-6">
                            <NumberStepper
                                value={defaultPrice ? Number(defaultPrice) : undefined}
                                min={0}
                                step={0.01}
                                decimalPlaces={2}
                                placeholder="输入价格"
                                size="sm"
                                onchange={(v) => defaultPrice = v !== undefined ? String(v) : ''}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- 预览 -->
        {#if previewCombinations.length > 0}
            <div class="space-y-3">
                <h3 class="font-medium text-gray-900">
                    预览：将创建 {previewCombinations.length} 个变体
                </h3>
                <div class="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div class="space-y-1 text-sm">
                        {#each previewSkus.slice(0, 10) as sku, i}
                            <div class="font-mono text-gray-600">{sku}</div>
                        {/each}
                        {#if previewSkus.length > 10}
                            <div class="text-gray-400">... 还有 {previewSkus.length - 10} 个</div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <!-- 错误提示 -->
        {#if error}
            <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        {/if}

        <!-- 结果 -->
        {#if createResult}
            <div class="p-3 {createResult.errors.length === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'} rounded-lg text-sm">
                <p>成功创建 {createResult.created_count} 个变体</p>
                {#if createResult.errors.length > 0}
                    <p class="mt-1">{createResult.errors.length} 个失败</p>
                {/if}
            </div>
        {/if}

        <!-- 按钮 -->
        <div class="flex gap-3 pt-4 border-t">
            <button
                onclick={onCancel}
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
                取消
            </button>
            <button
                onclick={createVariants}
                disabled={creating || previewCombinations.length === 0}
                class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if creating}
                    创建中...
                {:else}
                    创建 {previewCombinations.length} 个变体
                {/if}
            </button>
        </div>
    {/if}
</div>