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

    // 编辑属性相关
    let editingAttribute: number | null = $state(null);
    let editAttrName = $state('');
    let editAttrCode = $state('');
    let editAttrOrder = $state(0);

    // 编辑属性值相关
    let editingValue: number | null = $state(null);
    let editValueName = $state('');
    let editValueCode = $state('');
    let editValueColor = $state('');
    let editValueOrder = $state(0);

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

    // 开始编辑属性
    function startEditAttribute(attr: ItemAttribute) {
        editingAttribute = attr.id;
        editAttrName = attr.name;
        editAttrCode = attr.code;
        editAttrOrder = attr.display_order;
    }

    // 取消编辑属性
    function cancelEditAttribute() {
        editingAttribute = null;
        editAttrName = '';
        editAttrCode = '';
        editAttrOrder = 0;
    }

    // 保存属性修改
    async function saveAttributeEdit(attrId: number) {
        if (!editAttrName.trim() || !editAttrCode.trim()) return;
        
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attributes/${attrId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editAttrName.trim(),
                    code: editAttrCode.trim().toLowerCase(),
                    display_order: editAttrOrder
                })
            });

            if (response.ok) {
                const updatedAttr = await response.json();
                attributes = attributes.map(a => a.id === attrId ? updatedAttr : a);
                cancelEditAttribute();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('修改属性失败: ' + (errorData.detail || JSON.stringify(errorData)));
            }
        } catch (e) {
            alert('网络错误');
        }
    }

    // 开始编辑属性值
    function startEditValue(value: ItemAttributeValue) {
        editingValue = value.id;
        editValueName = value.value;
        editValueCode = value.code;
        editValueColor = value.color_hex || '';
        editValueOrder = value.display_order;
    }

    // 取消编辑属性值
    function cancelEditValue() {
        editingValue = null;
        editValueName = '';
        editValueCode = '';
        editValueColor = '';
        editValueOrder = 0;
    }

    // 保存属性值修改
    async function saveValueEdit(valueId: number) {
        if (!editValueName.trim() || !editValueCode.trim()) return;
        
        try {
            const body: any = {
                value: editValueName.trim(),
                code: editValueCode.trim().toLowerCase(),
                display_order: editValueOrder
            };
            if (editValueColor) {
                body.color_hex = editValueColor;
            }

            const response = await fetch(`${config.API_BASE_URL}/product/attribute-values/${valueId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const updatedValue = await response.json();
                attributeValues = attributeValues.map(v => v.id === valueId ? updatedValue : v);
                cancelEditValue();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('修改属性值失败: ' + (errorData.detail || JSON.stringify(errorData)));
            }
        } catch (e) {
            alert('网络错误');
        }
    }

    // 切换属性启用状态
    async function toggleAttributeActive(attr: ItemAttribute) {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attributes/${attr.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !attr.is_active })
            });

            if (response.ok) {
                const updatedAttr = await response.json();
                attributes = attributes.map(a => a.id === attr.id ? updatedAttr : a);
            } else {
                alert('操作失败');
            }
        } catch (e) {
            alert('网络错误');
        }
    }

    // 切换属性值启用状态
    async function toggleValueActive(value: ItemAttributeValue) {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/attribute-values/${value.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !value.is_active })
            });

            if (response.ok) {
                const updatedValue = await response.json();
                attributeValues = attributeValues.map(v => v.id === value.id ? updatedValue : v);
            } else {
                alert('操作失败');
            }
        } catch (e) {
            alert('网络错误');
        }
    }
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
                    <!-- 属性头部：显示或编辑 -->
                    {#if editingAttribute === attribute.id}
                        <div class="mb-3 space-y-2 bg-white p-3 rounded border border-blue-200">
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="属性名称"
                                    bind:value={editAttrName}
                                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="代码"
                                    bind:value={editAttrCode}
                                    class="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="排序"
                                    bind:value={editAttrOrder}
                                    class="w-16 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div class="flex gap-2">
                                <button
                                    onclick={() => saveAttributeEdit(attribute.id)}
                                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    保存
                                </button>
                                <button
                                    onclick={cancelEditAttribute}
                                    class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium text-gray-700">{attribute.name}</h4>
                                <span class="text-xs text-gray-400">({attribute.code})</span>
                                {#if showManage}
                                    <button 
                                        onclick={() => startEditAttribute(attribute)}
                                        class="text-xs text-gray-400 hover:text-blue-600"
                                        title="编辑属性"
                                    >
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                {/if}
                            </div>
                            {#if showManage}
                                <div class="flex items-center gap-2">
                                    <button 
                                        onclick={() => showAddValueForAttr = showAddValueForAttr === attribute.id ? null : attribute.id}
                                        class="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        + 添加值
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                    
                    <!-- 属性值列表 -->
                    <div class="flex flex-wrap gap-2">
                        {#each values as value}
                            {#if editingValue === value.id}
                                <div class="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200">
                                    <input
                                        type="text"
                                        bind:value={editValueName}
                                        class="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                    <input
                                        type="text"
                                        bind:value={editValueCode}
                                        class="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                    {#if attribute.code === 'color'}
                                        <input
                                            type="color"
                                            bind:value={editValueColor}
                                            class="w-6 h-6 p-0 border border-gray-300 rounded cursor-pointer"
                                        />
                                    {/if}
                                    <input
                                        type="number"
                                        bind:value={editValueOrder}
                                        class="w-12 px-2 py-1 text-xs border border-gray-300 rounded"
                                        placeholder="排序"
                                    />
                                    <button
                                        onclick={() => saveValueEdit(value.id)}
                                        class="text-green-600 hover:text-green-800"
                                        title="保存"
                                        aria-label="保存"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onclick={cancelEditValue}
                                        class="text-gray-400 hover:text-gray-600"
                                        title="取消"
                                        aria-label="取消"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            {:else}
                                <div class="group inline-flex items-center">
                                    <button
                                        onclick={() => toggleValue(attribute.id, value.id)}
                                        class="px-3 py-1.5 text-sm rounded-l-lg border-y border-l transition-all {isValueSelected(value.id)
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
                                    {#if showManage}
                                        <button
                                            type="button"
                                            onclick={() => startEditValue(value)}
                                            class="px-2 py-1.5 text-sm rounded-r-lg border-y border-r border-gray-300 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                                            title="编辑"
                                            aria-label="编辑"
                                        >
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    {:else}
                                        <span class="px-0.5"></span>
                                    {/if}
                                </div>
                            {/if}
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
