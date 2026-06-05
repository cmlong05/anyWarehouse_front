// 构建分类搜索选项：展示时保留层级缩进，搜索时补充相关分类名称。
// 被依赖：
// - `lib/utils/index.ts`
//
// 搜索词会覆盖当前分类、祖先、后代和兄弟分类，方便用户只记得
// 附近相关名称时也能搜到目标分类。
type CategoryOptionInput = {
    id: number;
    name: string;
    tree_id?: number;
    lft?: number;
    level: number;
    parent: number | null;
};

export type CategorySearchOption = {
    value: number;
    label: string;
    searchText: string;
};

export function buildCategoryRelationSearchOptions(
    categories: CategoryOptionInput[]
): CategorySearchOption[] {
    const orderedCategories = [...categories].sort((a, b) => {
        const treeDiff = (a.tree_id ?? 0) - (b.tree_id ?? 0);
        if (treeDiff !== 0) {
            return treeDiff;
        }

        const lftDiff = (a.lft ?? 0) - (b.lft ?? 0);
        if (lftDiff !== 0) {
            return lftDiff;
        }

        return a.id - b.id;
    });

    // 先建立索引，方便后面快速查父节点和子节点。
    const categoryById = new Map<number, CategoryOptionInput>();
    const childrenByParent = new Map<number | null, CategoryOptionInput[]>();

    for (const category of orderedCategories) {
        categoryById.set(category.id, category);
        const parentId = category.parent ?? null;
        const currentChildren = childrenByParent.get(parentId) ?? [];
        currentChildren.push(category);
        childrenByParent.set(parentId, currentChildren);
    }

    // 向上追溯到根节点，把所有祖先名称都纳入搜索词。
    function getAncestorNames(category: CategoryOptionInput): string[] {
        const names: string[] = [];
        let currentParentId = category.parent ?? null;

        while (currentParentId !== null) {
            const parentCategory = categoryById.get(currentParentId);
            if (!parentCategory) {
                break;
            }
            names.push(parentCategory.name);
            currentParentId = parentCategory.parent ?? null;
        }

        return names;
    }

    // 向下遍历整棵子树，把所有后代名称都纳入搜索词。
    function getDescendantNames(categoryId: number): string[] {
        const names: string[] = [];
        const stack = [...(childrenByParent.get(categoryId) ?? [])];

        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) {
                continue;
            }
            names.push(node.name);
            const children = childrenByParent.get(node.id) ?? [];
            for (const child of children) {
                stack.push(child);
            }
        }

        return names;
    }

    return orderedCategories.map((category) => {
        // label 只负责显示层级缩进，searchText 负责尽量覆盖相关名称。
        const relatedNames = new Set<string>([category.name]);
        const parentId = category.parent ?? null;
        const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(Math.max(category.level, 0));

        for (const ancestorName of getAncestorNames(category)) {
            relatedNames.add(ancestorName);
        }

        for (const descendantName of getDescendantNames(category.id)) {
            relatedNames.add(descendantName);
        }

        for (const sibling of childrenByParent.get(parentId) ?? []) {
            if (sibling.id !== category.id) {
                relatedNames.add(sibling.name);
            }
        }

        return {
            value: category.id,
            label: `${indent}${category.name}`,
            searchText: Array.from(relatedNames).join(' '),
        };
    });
}