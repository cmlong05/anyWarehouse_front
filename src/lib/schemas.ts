import { z } from 'zod';

export const containerSchema = z.object({
    fastCode: z.string()
        .min(1, '快速代码不能为空')
        .max(50, '快速代码不能超过50个字符')
        .regex(/^[A-Za-z0-9\-_]+$/, '快速代码只能包含字母、数字、横线和下划线'),
    barcode: z.string().max(100, '条形码不能超过100个字符').optional().or(z.literal('')),
    mark: z.string().max(200, '标记不能超过200个字符').optional().or(z.literal('')),
    volume: z.number()
        .min(1, '总容量必须大于0')
        .max(999999, '总容量不能超过999999'),
    zz_volume: z.number()
        .min(0, '自占体积不能为负数')
        .max(999999, '自占体积不能超过999999')
        .optional()
        .default(0),
    zz_weight: z.number()
        .min(0, '箱体自重不能为负数')
        .max(999999, '箱体自重不能超过999999')
        .optional()
        .default(0),
    parent: z.number().optional().nullable()
});

export const categorySchema = z.object({
    name: z.string()
        .min(1, '分类名称不能为空')
        .max(100, '分类名称不能超过100个字符'),
    parent: z.number().optional().nullable(),
    top_category: z.boolean().default(false)
});

export type ContainerFormData = z.infer<typeof containerSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
