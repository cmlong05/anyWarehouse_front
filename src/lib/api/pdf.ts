/**
 * PDF 下载共享工具
 *
 * 从服务端获取 PDF blob 并触发浏览器下载。
 * 仅可在浏览器环境调用（依赖 document / URL.createObjectURL）。
 */
import { config } from '$lib/config';

export class PdfDownloadError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = 'PdfDownloadError';
    }
}

/**
 * 下载并保存 PDF 文件。
 * @param path 相对于 API_BASE_URL 的路径（应以 / 开头或不以 / 开头都可）
 * @param filename 保存到本地的文件名
 */
export async function downloadPdf(path: string, filename: string): Promise<void> {
    if (typeof document === 'undefined') {
        throw new PdfDownloadError('PDF 下载只能在浏览器环境中执行');
    }

    const url = `${config.API_BASE_URL}${path}`;
    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) {
        // 尝试读取后端返回的错误详情，便于排错
        let detail = '';
        try {
            const text = await resp.text();
            detail = text ? `: ${text.slice(0, 200)}` : '';
        } catch {
            // 忽略
        }
        throw new PdfDownloadError(
            `PDF 生成失败 (${resp.status} ${resp.statusText})${detail}`,
            resp.status
        );
    }

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        URL.revokeObjectURL(blobUrl);
    }
}
