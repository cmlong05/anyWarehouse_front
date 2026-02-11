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

// ========== Component (BOM) Schemas ==========

export const componentSchema = z.object({
    parent_item: z.number()
        .gt(0, '请选择有效的父物品'),
    child_item: z.number()
        .gt(0, '请选择有效的子物品'),
    quantity: z.number()
        .gte(1, '数量至少为1')
        .lte(999999, '数量不能超过999999'),
    order: z.number()
        .gte(0, '排序不能为负数')
        .lte(9999, '排序不能超过9999')
        .default(0),
    note: z.string()
        .max(500, '备注不能超过500个字符')
        .default('')
}).refine((data) => data.parent_item !== data.child_item, {
    message: '父物品和子物品不能相同（不能自引用）',
    path: ['child_item']
});

export type ContainerFormData = z.infer<typeof containerSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
export type ComponentFormData = z.infer<typeof componentSchema>;

// API 响应类型定义
export interface Item {
    id: number;
    SKU: string;
    name: string;
    SKU_zite?: string;
    SKU_A?: string;
    description?: string;
    image?: string;
    weight?: string;
    p_volume?: number;
    s_volume?: number;
    b_Price?: string;
    currency?: string;
    in_fee?: number;
    barcode?: string;
    category?: number[];
}

export interface ItemSearchResponse {
    query: string;
    count: number;
    results: Item[];
}

// ========== Customer Schemas ==========

export const customerSchema = z.object({
    code: z.string()
        .min(1, '客户编号不能为空')
        .max(20, '客户编号不能超过20个字符'),
    name: z.string()
        .min(1, '客户名称不能为空')
        .max(100, '客户名称不能超过100个字符'),
    contact_name: z.string()
        .max(50, '联系人不能超过50个字符')
        .optional()
        .or(z.literal('')),
    phone: z.string()
        .max(30, '联系电话不能超过30个字符')
        .optional()
        .or(z.literal('')),
    email: z.string()
        .email('请输入有效的邮箱地址')
        .max(100, '邮箱不能超过100个字符')
        .optional()
        .or(z.literal('')),
    address: z.string()
        .max(200, '地址不能超过200个字符')
        .optional()
        .or(z.literal('')),
    level: z.enum(['VIP', 'NORMAL', 'TEMP']).default('NORMAL'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    remark: z.string()
        .max(500, '备注不能超过500个字符')
        .optional()
        .or(z.literal(''))
});

export const customerAddressSchema = z.object({
    name: z.string()
        .min(1, '地址名称不能为空')
        .max(50, '地址名称不能超过50个字符'),
    contact_name: z.string()
        .max(50, '联系人不能超过50个字符')
        .optional()
        .or(z.literal('')),
    phone: z.string()
        .max(30, '联系电话不能超过30个字符')
        .optional()
        .or(z.literal('')),
    province: z.string()
        .max(50, '省份不能超过50个字符')
        .optional()
        .or(z.literal('')),
    city: z.string()
        .max(50, '城市不能超过50个字符')
        .optional()
        .or(z.literal('')),
    district: z.string()
        .max(50, '区县不能超过50个字符')
        .optional()
        .or(z.literal('')),
    detail_address: z.string()
        .min(1, '详细地址不能为空')
        .max(200, '详细地址不能超过200个字符'),
    is_default: z.boolean().default(false),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    remark: z.string()
        .max(200, '备注不能超过200个字符')
        .optional()
        .or(z.literal(''))
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerAddressFormData = z.infer<typeof customerAddressSchema>;

export interface Customer {
    id: number;
    code: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    level: 'VIP' | 'NORMAL' | 'TEMP';
    status: 'ACTIVE' | 'INACTIVE';
    remark?: string;
    addresses?: CustomerAddress[];
    address_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CustomerAddress {
    id: number;
    customer: number;
    name: string;
    contact_name?: string;
    phone?: string;
    province?: string;
    city?: string;
    district?: string;
    detail_address: string;
    is_default: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    remark?: string;
    created_at: string;
    updated_at: string;
}
