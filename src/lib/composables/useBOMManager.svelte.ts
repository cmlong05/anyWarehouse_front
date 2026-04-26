/**
 * BOM 物料清单管理共享逻辑
 */
import { componentAPI, itemBOMAPI } from '$lib/api';
import type { ComponentDetail, BOMTreeNode, TotalComponentItem, WhereUsedItem, BaseItem } from '$lib';
import { logger } from '$lib/logger';
import { getErrorMessage } from '$lib/utils/errors';

export interface MaxProducibleResult {
    max_producible: number;
    limiting_factor: { 
        item_id: number; 
        sku: string; 
        name: string; 
        available: number; 
        required: number 
    } | null;
}

export interface ComponentFormData {
    quantity: number;
    order: number;
    note: string;
}

export function useBOMManager(itemId: number, itemSKU: string) {
    // 数据状态
    let components = $state<ComponentDetail[]>([]);
    let whereUsed = $state<WhereUsedItem[]>([]);
    let bomTree = $state<BOMTreeNode[]>([]);
    let totalComponents = $state<TotalComponentItem[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);

    // 计算状态
    let maxProducibleResult = $state<MaxProducibleResult | null>(null);
    let calculatingMax = $state(false);

    // 排序后的组件列表
    let sortedComponents = $derived([...components].sort((a, b) => a.order - b.order));

    // 加载所有数据
    async function loadData() {
        loading = true;
        error = null;
        try {
            const [comps, whereUsedRes, treeRes, totalRes] = await Promise.all([
                componentAPI.getByParent(itemId),
                itemBOMAPI.getWhereUsed(itemId),
                itemBOMAPI.getBOMTree(itemId, 10),
                itemBOMAPI.getTotalComponents(itemId)
            ]);
            components = comps;
            whereUsed = whereUsedRes.used_in;
            bomTree = treeRes.bom_tree;
            totalComponents = totalRes.total_components;
            // 清空计算结果
            maxProducibleResult = null;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载数据失败';
            logger.error('加载BOM数据失败', err);
        } finally {
            loading = false;
        }
    }

    // 添加组件
    async function addComponent(childItemId: number, data: ComponentFormData): Promise<boolean> {
        try {
            await componentAPI.create({
                parent_item: itemId,
                child_item: childItemId,
                quantity: data.quantity,
                order: data.order,
                note: data.note
            });
            await loadData();
            return true;
        } catch (err) {
            const message = getErrorMessage(err, '添加失败');
            if (message.includes('circular')) {
                throw new Error('不能创建循环依赖（子物品不能是父物品的父级）');
            }
            throw new Error(message);
        }
    }

    // 更新组件
    async function updateComponent(componentId: number, data: ComponentFormData): Promise<boolean> {
        try {
            await componentAPI.patch(componentId, {
                quantity: data.quantity,
                order: data.order,
                note: data.note
            });
            await loadData();
            return true;
        } catch (err) {
            throw new Error('更新失败，请重试');
        }
    }

    // 删除组件
    async function deleteComponent(componentId: number): Promise<boolean> {
        try {
            await componentAPI.delete(componentId);
            await loadData();
            return true;
        } catch (err) {
            throw new Error(getErrorMessage(err, '删除失败'));
        }
    }

    // 计算可组装数量
    function calculateMaxProducible() {
        calculatingMax = true;
        
        setTimeout(() => {
            try {
                // 计算节点能支持多少个父节点
                function calcNode(node: BOMTreeNode): {
                    canSupport: number;
                    limiter: MaxProducibleResult['limiting_factor'];
                } {
                    const stock = node.total_storage;
                    const needPerParent = node.quantity;
                    
                    // 叶子节点：只能用库存
                    if (!node.children || node.children.length === 0) {
                        const canSupport = Math.floor(stock / needPerParent);
                        return {
                            canSupport,
                            limiter: canSupport > 0 ? null : {
                                item_id: node.item.id,
                                sku: node.item.SKU,
                                name: node.item.name,
                                available: stock,
                                required: needPerParent
                            }
                        };
                    }
                    
                    // 半成品：库存 + 子组件组装
                    const fromStock = Math.floor(stock / needPerParent);
                    
                    let minChildAssemblable = Infinity;
                    let childLimiter: MaxProducibleResult['limiting_factor'] = null;
                    
                    for (const child of node.children) {
                        const childResult = calcNode(child);
                        const assemblable = Math.floor(childResult.canSupport / child.quantity);
                        if (assemblable < minChildAssemblable) {
                            minChildAssemblable = assemblable;
                            childLimiter = childResult.limiter;
                        }
                    }
                    
                    const fromAssembly = minChildAssemblable === Infinity ? 0 : minChildAssemblable;
                    const totalCanSupport = fromStock + fromAssembly;
                    
                    let limiter: MaxProducibleResult['limiting_factor'];
                    
                    if (childLimiter && fromAssembly <= fromStock) {
                        limiter = childLimiter;
                    } else if (fromStock <= fromAssembly) {
                        limiter = {
                            item_id: node.item.id,
                            sku: node.item.SKU,
                            name: node.item.name,
                            available: stock,
                            required: needPerParent
                        };
                    } else {
                        limiter = null;
                    }
                    
                    return { canSupport: totalCanSupport, limiter };
                }
                
                const childNodes = bomTree.filter(node => node.item.SKU !== itemSKU);
                
                let minProducible = Infinity;
                let finalLimiter: MaxProducibleResult['limiting_factor'] = null;
                let minNodeInfo: MaxProducibleResult['limiting_factor'] = null;
                
                for (const node of childNodes) {
                    const result = calcNode(node);
                    if (result.canSupport < minProducible) {
                        minProducible = result.canSupport;
                        finalLimiter = result.limiter;
                        minNodeInfo = {
                            item_id: node.item.id,
                            sku: node.item.SKU,
                            name: node.item.name,
                            available: node.total_storage,
                            required: node.quantity
                        };
                    }
                }
                
                if (!finalLimiter && minNodeInfo) {
                    finalLimiter = minNodeInfo;
                }
                
                maxProducibleResult = {
                    max_producible: minProducible === Infinity ? 0 : minProducible,
                    limiting_factor: finalLimiter
                };
            } finally {
                calculatingMax = false;
            }
        }, 0);
    }

    // 处理搜索结果过滤
    function filterSearchResults(results: (BaseItem & { id: number })[]) {
        return results.filter(item => item.id !== itemId).map(item => ({
            value: item.id,
            label: `${item.SKU} - ${item.name}`
        }));
    }

    return {
        // 状态
        get components() { return components; },
        get sortedComponents() { return sortedComponents; },
        get whereUsed() { return whereUsed; },
        get bomTree() { return bomTree; },
        get totalComponents() { return totalComponents; },
        get loading() { return loading; },
        get error() { return error; },
        get maxProducibleResult() { return maxProducibleResult; },
        get calculatingMax() { return calculatingMax; },
        
        // 方法
        loadData,
        addComponent,
        updateComponent,
        deleteComponent,
        calculateMaxProducible,
        filterSearchResults,
        
        // 直接设置状态（用于编辑）
        setError(msg: string | null) { error = msg; }
    };
}
