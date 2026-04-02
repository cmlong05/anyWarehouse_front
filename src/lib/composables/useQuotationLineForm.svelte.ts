/**
 * 报价行表单 Composable
 *
 * 提供供应商报价和客户报价共享的行管理逻辑：
 * - 报价行的增删和状态维护
 * - 物品搜索、选择、变体展开
 * - 行级表单校验
 * - 批量提交循环
 */
import type { Item } from '$lib';
import type { ItemVariant } from '$lib/types/variant';
import { itemAPI } from '$lib/api';

export interface QuotationLine {
    id: number;
    item: number | null;
    price: string;
    currency: string;
    min_quantity: number;
    lead_time_days: number | null;
    note: string;
    itemDetail?: Item | null;
    isVariantChild?: boolean;
    parentLineId?: number;
    variantInfo?: ItemVariant;
}

export interface UseQuotationLineFormOptions {
    /** 返回新行使用的默认货币（可为响应式 derived 值） */
    getCurrency: () => string;
    /** API 基础 URL，用于获取变体列表 */
    apiBaseUrl: string;
    /** 行内错误回调（如：表单内重复物品提示） */
    onInlineError: (msg: string) => void;
}

export function useQuotationLineForm(options: UseQuotationLineFormOptions) {
    let quotationLines = $state<QuotationLine[]>([]);
    let lineIdCounter = 0;

    function createEmptyLine(parentId?: number): QuotationLine {
        return {
            id: ++lineIdCounter,
            item: null,
            price: '',
            currency: options.getCurrency(),
            min_quantity: 1,
            lead_time_days: null,
            note: '',
            itemDetail: null,
            isVariantChild: !!parentId,
            parentLineId: parentId,
        };
    }

    async function fetchItemVariants(itemId: number): Promise<ItemVariant[]> {
        try {
            const response = await fetch(`${options.apiBaseUrl}/product/item/${itemId}/variants/`);
            if (response.ok) {
                const data = await response.json();
                return data.variants || [];
            }
        } catch {
            // 获取变体列表失败，静默处理
        }
        return [];
    }

    function isVariantTemplate(item: Item): boolean {
        const val = (item as unknown as Record<string, unknown>).is_variant_template;
        if (val === true) return true;
        if (typeof val === 'string' && val.toLowerCase() === 'true') return true;
        if (val === 1 || val === '1') return true;
        return false;
    }

    /** 处理 Svelecte fetch 回调，将 API 响应转为选项格式 */
    function handleItemFetch(json: unknown) {
        const items = Array.isArray(json) ? json : ((json as { results?: Item[] })?.results || []);
        return items.map((item: Item) => ({
            value: item.id,
            label: `${item.SKU} - ${item.name}`
        }));
    }

    /** 处理 Svelecte onChange 事件，兼容返回对象或原始值两种情况 */
    function handleSelectChange(line: QuotationLine, selectedValue: unknown) {
        let selectedId: number | null = null;

        if (typeof selectedValue === 'number') {
            selectedId = selectedValue;
        } else if (typeof selectedValue === 'string') {
            selectedId = parseInt(selectedValue, 10);
        } else if (selectedValue && typeof selectedValue === 'object') {
            const val = (selectedValue as Record<string, unknown>).value;
            if (typeof val === 'number') {
                selectedId = val;
            } else if (typeof val === 'string') {
                selectedId = parseInt(val, 10);
            }
        }

        handleItemSelect(line, selectedId);
    }

    /** 选择物品后：加载详情、检查重复、展开变体、自动添加新行 */
    async function handleItemSelect(line: QuotationLine, selectedItemId: number | null) {
        const itemId =
            typeof selectedItemId === 'number' ? selectedItemId :
            typeof selectedItemId === 'string' ? parseInt(selectedItemId, 10) : null;

        if (!itemId || isNaN(itemId)) {
            line.item = null;
            line.itemDetail = null;
            return;
        }

        // 检查表单内是否已存在相同物品（变体子行不计入）
        const duplicateLine = quotationLines.find(
            l => l.id !== line.id && !l.isVariantChild && l.item === itemId
        );
        if (duplicateLine) {
            options.onInlineError(`物品已在第 ${quotationLines.indexOf(duplicateLine) + 1} 行添加，请勿重复添加`);
            line.item = null;
            return;
        }

        const lineIndex = quotationLines.findIndex(l => l.id === line.id);
        if (lineIndex === -1) return;

        try {
            const itemResponse = await itemAPI.get(itemId);
            const item = (itemResponse as any).item || itemResponse;

            const updatedLine = { ...line, item: itemId, itemDetail: item };
            quotationLines[lineIndex] = updatedLine;
            quotationLines = [...quotationLines];

            // 变体母版：插入所有变体子行
            if (isVariantTemplate(item)) {
                const variants = await fetchItemVariants(itemId);
                if (variants.length > 0) {
                    const variantLines: QuotationLine[] = variants.map(variant => ({
                        id: ++lineIdCounter,
                        item: variant.variant_item,
                        price: '',
                        currency: options.getCurrency(),
                        min_quantity: 1,
                        lead_time_days: null,
                        note: '',
                        itemDetail: variant.variant_item_detail as unknown as Item,
                        isVariantChild: true,
                        parentLineId: line.id,
                        variantInfo: variant,
                    }));
                    quotationLines = [
                        ...quotationLines.slice(0, lineIndex + 1),
                        ...variantLines,
                        ...quotationLines.slice(lineIndex + 1),
                    ];
                }
            }

            // 当前行是最后一行时自动追加空行
            const lastLine = quotationLines[quotationLines.length - 1];
            if (lastLine && lastLine.id === line.id && updatedLine.item) {
                addLine();
            }
        } catch {
            line.itemDetail = null;
        }
    }

    function addLine() {
        quotationLines = [...quotationLines, createEmptyLine()];
    }

    /** 删除行；若删除的是母版行，同时删除其所有变体子行 */
    function removeLine(lineId: number) {
        const lineToRemove = quotationLines.find(l => l.id === lineId);
        if (!lineToRemove) return;

        if (quotationLines.length <= 1) {
            quotationLines = [createEmptyLine()];
            return;
        }

        quotationLines = lineToRemove.isVariantChild
            ? quotationLines.filter(l => l.id !== lineId)
            : quotationLines.filter(l => l.id !== lineId && l.parentLineId !== lineId);
    }

    /**
     * 根据物品 ID 列表批量加载物品并填充行（含变体展开）
     * 供页面 onMount 时预填充 URL 参数传入的物品
     */
    async function loadPresetItems(itemIds: number[]) {
        for (const itemId of itemIds) {
            try {
                const itemResponse = await itemAPI.get(itemId);
                const item = (itemResponse as unknown as { item?: Item }).item || itemResponse as Item;
                const line = createEmptyLine();
                line.item = itemId;
                line.itemDetail = item;
                quotationLines = [...quotationLines, line];

                if (isVariantTemplate(item)) {
                    const variants = await fetchItemVariants(itemId);
                    if (variants.length > 0) {
                        const variantLines: QuotationLine[] = variants.map(variant => ({
                            id: ++lineIdCounter,
                            item: variant.variant_item,
                            price: '',
                            currency: options.getCurrency(),
                            min_quantity: 1,
                            lead_time_days: null,
                            note: '',
                            itemDetail: variant.variant_item_detail as unknown as Item,
                            isVariantChild: true,
                            parentLineId: line.id,
                            variantInfo: variant,
                        }));
                        quotationLines = [...quotationLines, ...variantLines];
                    }
                }
            } catch {
                // 加载单个物品失败，跳过
            }
        }
    }

    /** 校验所有有效行（有物品的行），返回第一个错误 */
    function validateLines(): { valid: boolean; error?: string } {
        const validLines = quotationLines.filter(l => l.item !== null);

        if (validLines.length === 0) {
            return { valid: false, error: '请至少添加一个物品的报价' };
        }

        for (const line of validLines) {
            const rowNum = quotationLines.findIndex(l => l.id === line.id) + 1;
            if (!line.price || parseFloat(line.price) <= 0) {
                return { valid: false, error: `第 ${rowNum} 行的价格必须大于0` };
            }
        }

        return { valid: true };
    }

    /**
     * 批量提交所有有效行
     * @param buildRequest 将行数据转换为 API 请求体
     * @param createFn     执行创建的 API 函数
     */
    async function submitLines<T>(
        buildRequest: (line: QuotationLine) => T,
        createFn: (data: T) => Promise<unknown>
    ): Promise<{ successCount: number; failCount: number; errors: string[] }> {
        const validLines = quotationLines.filter(l => l.item !== null);
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const line of validLines) {
            try {
                await createFn(buildRequest(line));
                successCount++;
            } catch (err) {
                failCount++;
                const rowNum = quotationLines.findIndex(l => l.id === line.id) + 1;
                const itemName = line.itemDetail?.name || '未知物品';
                const errMsg = err instanceof Error ? err.message : ((err as any)?.message || '创建失败');
                errors.push(`第 ${rowNum} 行 (${itemName}): ${errMsg}`);
            }
        }

        return { successCount, failCount, errors };
    }

    return {
        get quotationLines() { return quotationLines; },
        set quotationLines(v: QuotationLine[]) { quotationLines = v; },
        createEmptyLine,
        addLine,
        removeLine,
        handleItemFetch,
        handleSelectChange,
        handleItemSelect,
        loadPresetItems,
        validateLines,
        submitLines,
    };
}
