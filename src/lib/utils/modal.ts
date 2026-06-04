/** 描述：模态对话框辅助工具，包含是否应关闭模态的判断和字段变更检测方法。 */
export type GuardedModalEvent = MouseEvent | KeyboardEvent;

/**
 * 判断模态框是否应当被关闭（例如点击遮罩或按下 Esc）。
 *
 * 逻辑：
 * - 当 `isPristine` 为 `false` 时，禁止关闭（返回 `false`）。
 * - 对于键盘事件，按下 `Escape` 时返回 `true`。
 * - 对于鼠标事件，仅在事件目标等于事件当前目标（通常为点击遮罩）时返回 `true`。
 *

 */
export function shouldDismissModal(event: GuardedModalEvent, isPristine: boolean): boolean {
    if (!isPristine) return false;
    if ('key' in event) return event.key === 'Escape';
    return event.target === event.currentTarget;
}

/**
 * 检查指定字段列表中是否有任意字段发生变化。
 *
 * 逐字段使用 `isEqual` 比较器比较 `current` 与 `initial` 对应字段的值，
 * 只要有任一字段返回不相等即认为有变更。
 *
 */
export function hasChangedFields<T extends Record<string, unknown>>(
    current: T,
    initial: T,
    fields: readonly (keyof T)[],
    isEqual: (currentValue: T[keyof T], initialValue: T[keyof T], field: keyof T) => boolean = Object.is
): boolean {
    return fields.some((field) => !isEqual(current[field], initial[field], field));
}
