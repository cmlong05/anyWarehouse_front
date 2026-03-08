<script lang="ts">
    import { config } from '$lib/config';
    import type { ItemAttribute, ItemAttributeValue } from '$lib/types/variant';
    import { FormInput } from '$lib/components/ui';

    interface Props {
        onSelect?: (attributeId: number, valueId: number) => void;
        selectedValues?: number[];
        showManage?: boolean;
    }

    let { onSelect, selectedValues = [], showManage = true }: Props = $props();

    // 状态
    let attributes = $state<ItemAttribute[]>([]);
    let attributeValues = $state<ItemAttributeValue[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);

    // 创建属性相关
    let showAddAttribute = $state(false);
    let newAttributeName = $state('');
    let newAttributeCode = $state('');

    // 创建属性值相关
    let showAddValueForAttr: number | null = $state(null);
    let newValueName = $state('');
    let newValueCode = $state('');
    let newValueColor = $state('');

    // 加载数据
    async function loadAttributes() {
        loading = true;
        error = null;
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attributes/`);
            if (response.ok) {
                attributes = await response.json();
            } else {
                error = '加载属性失败';
            }
        } catch (e) {
            error = '网络错误';
        } finally {
            loading = false;
        }
    }

    async function loadAttributeValues() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attribute-values/`);
            if (response.ok) {
                attributeValues = await response.json();
            } else {
                console.error('加载属性值失败:', response.status);
            }
        } catch (e) {
            console.error('加载属性值失败:', e);
        }
    }

    // 刷新所有数据
    async function refreshAll() {
        await Promise.all([loadAttributes(), loadAttributeValues()]);
    }

    // 创建属性
    async function createAttribute() {
        if (!newAttributeName.trim() || !newAttributeCode.trim()) return;
        
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attributes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAttributeName.trim(),
                    code: newAttributeCode.trim().toLowerCase(),
                    display_order: attributes.length + 1
                })
            });

            if (response.ok) {
                const newAttr = await response.json();
                attributes = [...attributes, newAttr];
                newAttributeName = '';
                newAttributeCode = '';
                showAddAttribute = false;
                // 重新加载确保数据同步
                await loadAttributes();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('创建属性失败: ' + (errorData.detail || JSON.stringify(errorData)));
            }
        } catch (e) {
            alert('网络错误');
        }
    }

    // 创建属性值
    async function createAttributeValue(attributeId: number) {
        if (!newValueName.trim() || !newValueCode.trim()) return;
        
        try {
            const body: any = {
                attribute: attributeId,
                value: newValueName.trim(),
                code: newValueCode.trim().toLowerCase()
            };
            
            // 如果是颜色属性，添加颜色代码
            const attr = attributes.find(a => a.id === attributeId);
            if (attr?.code === 'color' && newValueColor) {
                body.color_hex = newValueColor;
            }

            const response = await fetch(`${config.API_BASE_URL}/product/attribute-values/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const newVal = await response.json();
                attributeValues = [...attributeValues, newVal];
                newValueName = '';
                newValueCode = '';
                newValueColor = '';
                showAddValueForAttr = null;
                // 重新加载确保数据同步
                await loadAttributeValues();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('创建属性值失败: ' + (errorData.detail || JSON.stringify(errorData)));
            }
        } catch (e) {
            alert('网络错误');
        }
    }

    // 获取属性的所有值
    function getValuesForAttribute(attributeId: number): ItemAttributeValue[] {
        return attributeValues.filter(v => v.attribute === attributeId && v.is_active);
    }

    // 检查值是否被选中
    function isValueSelected(valueId: number): boolean {
        return selectedValues.includes(valueId);
    }

    // 切换选择
    function toggleValue(attributeId: number, valueId: number) {
        onSelect?.(attributeId, valueId);
    }

    // 初始化加载
    $effect(() => {
        refreshAll();
    });
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">属性管理</h2>
        <button
            onclick={refreshAll}
            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            disabled={loading}
        >
            {#if loading}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                刷新中...
            {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新
            {/if}
        </button>
    </div>

    {#if loading}
        <div class="text-center py-8 text-gray-500">
            <svg class="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载中...
        </div>
    {:else if error}
        <div class="text-center py-8">
            <div class="text-red-500 mb-2">{error}</div>
            <button onclick={refreshAll} class="text-blue-600 hover:underline">重试</button>
        </div>
    {:else if attributes.length === 0}
        <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            </div>
            <p class="text-gray-500">暂无属性定义</p>
            {#if showManage}
                <button 
                    onclick={() => showAddAttribute = true}
                    class="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + 创建第一个属性
                </button>
            {/if}
        </div>
    {:else}
        <div class="space-y-4">
            {#each attributes.filter(a => a.is_active) as attribute}
                {@const values = getValuesForAttribute(attribute.id)}
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-700">{attribute.name}</h4>
                        {#if showManage}
                            <button 
                                onclick={() => showAddValueForAttr = showAddValueForAttr === attribute.id ? null : attribute.id}
                                class="text-xs text-blue-600 hover:text-blue-800"
                            >
                                + 添加值
                            </button>
                        {/if}
                    </div>
                    
                    <!-- 属性值列表 -->
                    <div class="flex flex-wrap gap-2">
                        {#each values as value}
                            <button
                                onclick={() => toggleValue(attribute.id, value.id)}
                                class="px-3 py-1.5 text-sm rounded-lg border transition-all {isValueSelected(value.id)
                                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
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
                        {#if values.length === 0}
                            <span class="text-sm text-gray-400">暂无属性值</span>
                        {/if}
                    </div>

                    <!-- 添加属性值表单 -->
                    {#if showManage && showAddValueForAttr === attribute.id}
                        <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="值名称（如：红色）"
                                    bind:value={newValueName}
                                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="代码（如：red）"
                                    bind:value={newValueCode}
                                    class="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                                />
                                {#if attribute.code === 'color'}
                                    <input
                                        type="color"
                                        bind:value={newValueColor}
                                        class="w-10 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                                    />
                                {/if}
                            </div>
                            <div class="flex gap-2">
                                <button
                                    onclick={() => createAttributeValue(attribute.id)}
                                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    保存
                                </button>
                                <button
                                    onclick={() => showAddValueForAttr = null}
                                    class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <!-- 添加属性按钮 -->
    {#if showManage}
        {#if !showAddAttribute}
            <button 
                onclick={() => showAddAttribute = true}
                class="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
                + 添加新属性
            </button>
        {:else}
            <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 class="text-sm font-medium text-blue-800 mb-2">添加新属性</h4>
                <div class="space-y-2">
                    <FormInput
                        label="属性名称"
                        name="attrName"
                        value={newAttributeName}
                        placeholder="如：颜色、尺寸、材质"
                        oninput={(v) => newAttributeName = v}
                    />
                    <FormInput
                        label="属性代码"
                        name="attrCode"
                        value={newAttributeCode}
                        placeholder="如：color、size（英文小写）"
                        oninput={(v) => newAttributeCode = v}
                    />
                    <div class="flex gap-2 pt-2">
                        <button
                            onclick={createAttribute}
                            class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            创建
                        </button>
                        <button
                            onclick={() => {
                                showAddAttribute = false;
                                newAttributeName = '';
                                newAttributeCode = '';
                            }}
                            class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>
