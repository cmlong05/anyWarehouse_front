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
    parent: z.string().optional().nullable()
});

export const categorySchema = z.object({
    name: z.string()
        .min(1, '分类名称不能为空')
        .max(100, '分类名称不能超过100个字符'),
    parent: z.number().optional().nullable(),
    top_category: z.boolean().default(false)
});

export const itemSchema = z.object({
    SKU: z.string()
        .min(1, 'SKU不能为空')
        .max(50, 'SKU不能超过50个字符'),
    name: z.string()
        .min(1, '商品名称不能为空')
        .max(200, '商品名称不能超过200个字符'),
    SKU_zite: z.string().max(50, 'SKU子码不能超过50个字符').optional().or(z.literal('')),
    SKU_A: z.string().max(50, 'SKU A码不能超过50个字符').optional().or(z.literal('')),
    description: z.string().max(1000, '描述不能超过1000个字符').optional().or(z.literal('')),
    image: z.string().max(500, '图片链接不能超过500个字符').optional().or(z.literal('')),
    weight: z.string().max(20, '重量不能超过20个字符').optional().or(z.literal('')),
    p_volume: z.number()
        .min(0, '包装体积不能为负数')
        .max(999999, '包装体积不能超过999999')
        .optional()
        .default(0),
    s_volume: z.number()
        .min(0, '存储体积不能为负数')
        .max(999999, '存储体积不能超过999999')
        .optional()
        .default(0),
    b_Price: z.string().max(20, '价格不能超过20个字符').optional().or(z.literal('')),
    currency: z.string().max(10, '货币代码不能超过10个字符').optional().or(z.literal('')),
    in_fee: z.number()
        .min(0, '入库费用不能为负数')
        .max(999999, '入库费用不能超过999999')
        .optional()
        .nullable(),
    barcode: z.string().max(100, '条形码不能超过100个字符').optional().or(z.literal('')),
    category: z.array(z.number()).optional().default([])
});

export type ContainerFormData = z.infer<typeof containerSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
