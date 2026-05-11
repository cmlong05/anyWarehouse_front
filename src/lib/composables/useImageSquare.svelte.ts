/**
 * 监听元素高度，返回正方形尺寸（用于让图片占位与基础信息同高）
 */
export function useImageSquare() {
    let el = $state<HTMLElement | null>(null);
    let size = $state(0);

    $effect(() => {
        if (!el) return;
        const update = () => {
            size = Math.max(0, Math.round(el?.offsetHeight ?? 0));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    });

    return {
        get size() { return size; },
        bind(node: HTMLElement) { el = node; },
    };
}
