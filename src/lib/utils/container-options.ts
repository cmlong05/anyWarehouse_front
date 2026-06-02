// 构建容器搜索选项：展示时保留层级缩进，搜索时补充相关容器名称。
// 对标 category-options.ts，用于 Svelecte 父容器/存储位置选择器。
type ContainerOptionInput = {
    id: number;
    fastCode: string;
    mark: string;
    tree_id?: number;
    lft?: number;
    level: number;
    parent: number | null;
};

export type ContainerSearchOption = {
    value: number | string;
    label: string;
    searchText: string;
};

export function buildContainerRelationSearchOptions(
    containers: ContainerOptionInput[],
    valueField: 'id' | 'fastCode' = 'id'
): ContainerSearchOption[] {
    const ordered = [...containers].sort((a, b) => {
        const treeDiff = (a.tree_id ?? 0) - (b.tree_id ?? 0);
        if (treeDiff !== 0) return treeDiff;
        const lftDiff = (a.lft ?? 0) - (b.lft ?? 0);
        if (lftDiff !== 0) return lftDiff;
        return a.id - b.id;
    });

    const containerById = new Map<number, ContainerOptionInput>();
    const childrenByParent = new Map<number | null, ContainerOptionInput[]>();

    for (const c of ordered) {
        containerById.set(c.id, c);
        const parentId = c.parent ?? null;
        const siblings = childrenByParent.get(parentId) ?? [];
        siblings.push(c);
        childrenByParent.set(parentId, siblings);
    }

    function getAncestorLabels(c: ContainerOptionInput): string[] {
        const labels: string[] = [];
        let parentId = c.parent ?? null;
        while (parentId !== null) {
            const parent = containerById.get(parentId);
            if (!parent) break;
            labels.push(parent.fastCode, parent.mark);
            parentId = parent.parent ?? null;
        }
        return labels;
    }

    function getDescendantLabels(id: number): string[] {
        const labels: string[] = [];
        const stack = [...(childrenByParent.get(id) ?? [])];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) continue;
            labels.push(node.fastCode, node.mark);
            for (const child of childrenByParent.get(node.id) ?? []) {
                stack.push(child);
            }
        }
        return labels;
    }

    return ordered.map((c) => {
        const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(Math.max(c.level, 0));
        const related = new Set<string>([c.fastCode, c.mark].filter(Boolean));

        for (const label of getAncestorLabels(c)) {
            if (label) related.add(label);
        }
        for (const label of getDescendantLabels(c.id)) {
            if (label) related.add(label);
        }
        for (const sibling of childrenByParent.get(c.parent ?? null) ?? []) {
            if (sibling.id !== c.id) {
                if (sibling.fastCode) related.add(sibling.fastCode);
                if (sibling.mark) related.add(sibling.mark);
            }
        }

        const displayLabel = c.mark ? `${indent}${c.fastCode} · ${c.mark}` : `${indent}${c.fastCode}`;

        return {
            value: valueField === 'fastCode' ? c.fastCode : c.id,
            label: displayLabel,
            searchText: Array.from(related).join(' '),
        };
    });
}
