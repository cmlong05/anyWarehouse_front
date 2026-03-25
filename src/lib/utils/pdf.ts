/**
 * 客户端 PDF 下载工具（基于 html2pdf.js，动态导入避免 SSR 问题）
 */

export interface PDFOptions {
    filename: string;
    elementId?: string;
}

/**
 * 将页面中指定元素生成为 PDF 并自动下载
 * @param options - filename: 下载文件名；elementId: 要捕获的 DOM 元素 ID（默认 'print-document'）
 */
export async function downloadElementAsPDF(options: PDFOptions): Promise<void> {
    const { filename, elementId = 'print-document' } = options;

    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Element #${elementId} not found`);

    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
        .set({
            margin: [10, 10, 10, 10],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();
}
