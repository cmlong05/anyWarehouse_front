/**
 * 标签打印工具
 *
 * 在新窗口中渲染一个固定尺寸的打印标签（快速代码 + CODE128 条形码 + 可选备注），
 * 加载后自动调用 window.print()，打印完成（或取消）后自动关闭窗口。
 *
 * HTML/CSS 模板见同目录 printLabel.template.html，通过 Vite `?raw` 内联导入。
 */

import labelTemplate from './printLabel.template.html?raw';

export interface LabelSize {
    id: string;
    label: string;
    width: number;  // mm
    height: number; // mm
}

export const DEFAULT_LABEL_SIZES: LabelSize[] = [
    { id: '100x100', label: '100 × 100 mm', width: 100, height: 100 },
    { id: '100x30', label: '100 × 30 mm', width: 100, height: 30 },
    { id: '50x30', label: '50 × 30 mm', width: 50, height: 30 }
];

export interface PrintLabelOptions {
    /** 主显示码（大字） */
    code: string;
    /** 条形码值（CODE128） */
    barcode: string;
    /** 标签尺寸（mm） */
    size: Pick<LabelSize, 'width' | 'height'>;
    /** 浏览器标签页标题 */
    title?: string;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function buildBarcodeSvg(value: string, opts: {
    fontSize: number;
    height: number;
    barWidth: number;
}): Promise<string> {
    const { default: JsBarcode } = await import('jsbarcode');
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgEl, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize: opts.fontSize,
        width: opts.barWidth,
        height: opts.height,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000'
    });
    return new XMLSerializer().serializeToString(svgEl);
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

interface LayoutPlan {
    layout: 'horizontal' | 'vertical';
    codeFontSize: string;   // CSS
    barcodeWidth: string;   // CSS
    barcodeHeight: string;  // CSS
    barcodeSvgFontSize: number;
    barcodeSvgHeight: number;
    barcodeSvgBarWidth: number;
}

// 1mm ≈ 3.78px (96dpi)
const MM_PX = 3.78;
// CODE128 单字符约 11 modules + 起止/校验约 35 modules 总开销
const CODE128_MODULES_OVERHEAD = 35;
const CODE128_MODULES_PER_CHAR = 11;
// 粗体等宽近似：字符宽度 ≈ 0.6 × 字号
const CHAR_WIDTH_RATIO = 0.6;

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

/** 在给定可用宽/高内，让代码字符串尽量大，但不超过宽度限制 */
function fitCodeFont(codeLen: number, availW: number, availH: number, maxMm: number): number {
    const byWidth = codeLen > 0 ? availW / (codeLen * CHAR_WIDTH_RATIO) : availH;
    return clamp(Math.min(byWidth, availH, maxMm), 2.5, maxMm);
}

/** 计算 JsBarcode 的 bar 宽（px），让条码刚好铺满可用宽度且不溢出 */
function fitBarcodeBarWidth(barcodeLen: number, availMm: number): number {
    const totalModules = barcodeLen * CODE128_MODULES_PER_CHAR + CODE128_MODULES_OVERHEAD;
    const availPx = availMm * MM_PX;
    return clamp(availPx / totalModules, 1, 3);
}

function planLayout(
    width: number,
    height: number,
    codeLen: number,
    barcodeLen: number
): LayoutPlan {
    const padding = 2; // mm，模板里 .label 的内边距
    const innerW = Math.max(width - padding * 2, 4);
    const innerH = Math.max(height - padding * 2, 4);

    if (width > height) {
        // ===== 左右排版：代码在左，条码在右 =====
        const maxCodeW = innerW * 0.45;
        const codeFont = fitCodeFont(codeLen, maxCodeW, innerH, innerH * 0.9);
        const codeBoxW = Math.min(maxCodeW, codeLen * codeFont * CHAR_WIDTH_RATIO + 1);
        const gap = 2;
        const barcodeBoxW = Math.max(innerW - codeBoxW - gap, innerW * 0.4);
        const barcodeBoxH = innerH;

        return {
            layout: 'horizontal',
            codeFontSize: `${codeFont.toFixed(2)}mm`,
            barcodeWidth: `${barcodeBoxW.toFixed(2)}mm`,
            barcodeHeight: `${barcodeBoxH.toFixed(2)}mm`,
            barcodeSvgFontSize: clamp(barcodeBoxH * MM_PX * 0.18, 8, 18),
            barcodeSvgHeight: clamp(barcodeBoxH * MM_PX * 0.65, 20, 200),
            barcodeSvgBarWidth: fitBarcodeBarWidth(barcodeLen, barcodeBoxW)
        };
    }

    // ===== 上下排版：代码在上，条码在下 =====
    const codeShare = 0.3;
    const codeZoneH = innerH * codeShare;
    const barcodeBoxH = innerH * (1 - codeShare);
    const codeFont = fitCodeFont(codeLen, innerW, codeZoneH, codeZoneH);
    const barcodeBoxW = innerW;

    return {
        layout: 'vertical',
        codeFontSize: `${codeFont.toFixed(2)}mm`,
        barcodeWidth: `${barcodeBoxW.toFixed(2)}mm`,
        barcodeHeight: `${barcodeBoxH.toFixed(2)}mm`,
        barcodeSvgFontSize: clamp(barcodeBoxH * MM_PX * 0.16, 8, 20),
        barcodeSvgHeight: clamp(barcodeBoxH * MM_PX * 0.7, 24, 240),
        barcodeSvgBarWidth: fitBarcodeBarWidth(barcodeLen, barcodeBoxW)
    };
}

function buildLabelHtml(opts: {
    code: string;
    barcodeMarkup: string;
    plan: LayoutPlan;
    title: string;
}): string {
    const { code, barcodeMarkup, plan, title } = opts;
    return renderTemplate(labelTemplate, {
        TITLE: escapeHtml(title),
        CODE: escapeHtml(code),
        BARCODE_SVG: barcodeMarkup,
        LAYOUT: plan.layout
    });
}

/**
 * 打开新窗口并打印标签。返回 true 表示已弹出窗口。
 */
export async function printLabel(options: PrintLabelOptions): Promise<boolean> {
    const { code, barcode, size, title } = options;
    if (!barcode) return false;

    const plan = planLayout(size.width, size.height, code.length, barcode.length);
    const barcodeMarkup = await buildBarcodeSvg(barcode, {
        fontSize: plan.barcodeSvgFontSize,
        height: plan.barcodeSvgHeight,
        barWidth: plan.barcodeSvgBarWidth
    });

    const w = window.open('', '_blank', 'width=640,height=640');
    if (!w) {
        alert('无法打开打印窗口，请允许弹出窗口');
        return false;
    }

    const html = buildLabelHtml({
        code,
        barcodeMarkup,
        plan,
        title: title ?? `${code} - 标签`
    });

    w.document.open();
    w.document.write(html);
    w.document.close();

    // 通过 DOM API 注入动态 CSS 变量，保持模板里的 <style> 块纯静态、可被编辑器校验。
    const root = w.document.documentElement;
    root.style.setProperty('--label-w', `${size.width}mm`);
    root.style.setProperty('--label-h', `${size.height}mm`);
    root.style.setProperty('--code-font', plan.codeFontSize);
    root.style.setProperty('--barcode-w', plan.barcodeWidth);
    root.style.setProperty('--barcode-h', plan.barcodeHeight);
    return true;
}
