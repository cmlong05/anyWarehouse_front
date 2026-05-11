/**
 * 监听元素高度，返回正方形尺寸（用于让图片占位与基础信息同高）
 *
 * @param maxSize 上限尺寸（像素），避免在窄屏下信息列换行后撑爆图片
 */
export function useImageSquare(maxSize = 280) {
    let el = $state<HTMLElement | null>(null);
    let size = $state(0);

    $effect(() => {
        if (!el) return;
        const update = () => {
            const h = Math.max(0, Math.round(el?.offsetHeight ?? 0));
            size = Math.min(h, maxSize);
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
