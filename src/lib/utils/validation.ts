/**
 * 表单验证工具
 */

/** 验证器函数类型 */
export type Validator<T = string> = (value: T, formData?: Record<string, unknown>) => string | undefined;

/** 验证器组合 */
export function combine<T>(...validators: Validator<T>[]): Validator<T> {
    return (value: T, formData?: Record<string, unknown>) => {
        for (const validator of validators) {
            const error = validator(value, formData);
            if (error) return error;
        }
        return undefined;
    };
}

/** 必填验证 */
export function required(message: string = '此字段不能为空'): Validator<unknown> {
    return (value: unknown) => {
        if (value === undefined || value === null || value === '') {
            return message;
        }
        return undefined;
    };
}

/** 最小长度验证 */
export function minLength(length: number, message?: string): Validator<string> {
    return (value: string) => {
        if (!value || value.length < length) {
            return message || `最少需要${length}个字符`;
        }
        return undefined;
    };
}

/** 最大长度验证 */
export function maxLength(length: number, message?: string): Validator<string> {
    return (value: string) => {
        if (value && value.length > length) {
            return message || `最多${length}个字符`;
        }
        return undefined;
    };
}

/** 邮箱验证 */
export function email(message: string = '请输入有效的邮箱地址'): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!pattern.test(value)) {
            return message;
        }
        return undefined;
    };
}

/** 最小值验证 */
export function min(min: number, message?: string): Validator<number> {
    return (value: number) => {
        if (value === undefined || value === null) return undefined;
        if (value < min) {
            return message || `不能小于${min}`;
        }
        return undefined;
    };
}

/** 最大值验证 */
export function max(max: number, message?: string): Validator<number> {
    return (value: number) => {
        if (value === undefined || value === null) return undefined;
        if (value > max) {
            return message || `不能大于${max}`;
        }
        return undefined;
    };
}

/** 范围验证 */
export function range(minVal: number, maxVal: number, message?: string): Validator<number> {
    return (value: number) => {
        if (value === undefined || value === null) return undefined;
        if (value < minVal || value > maxVal) {
            return message || `必须在${minVal}和${maxVal}之间`;
        }
        return undefined;
    };
}

/** 正则表达式验证 */
export function pattern(regex: RegExp, message: string): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        if (!regex.test(value)) {
            return message;
        }
        return undefined;
    };
}

/** 数字验证 */
export function numeric(message: string = '必须是数字'): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        if (isNaN(Number(value))) {
            return message;
        }
        return undefined;
    };
}

/** 正数验证 */
export function positive(message: string = '必须大于0'): Validator<number> {
    return (value: number) => {
        if (value === undefined || value === null) return undefined;
        if (value <= 0) {
            return message;
        }
        return undefined;
    };
}

/** 非负数验证 */
export function nonNegative(message: string = '不能为负数'): Validator<number> {
    return (value: number) => {
        if (value === undefined || value === null) return undefined;
        if (value < 0) {
            return message;
        }
        return undefined;
    };
}

/** 手机号验证（中国大陆） */
export function mobilePhone(message: string = '请输入有效的手机号码'): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        const pattern = /^1[3-9]\d{9}$/;
        if (!pattern.test(value)) {
            return message;
        }
        return undefined;
    };
}

/** 电话验证（固话或手机） */
export function phone(message: string = '请输入有效的电话号码'): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        const pattern = /^1[3-9]\d{9}$|^(\d{3,4}-)?\d{7,8}$/;
        if (!pattern.test(value)) {
            return message;
        }
        return undefined;
    };
}

/** 日期验证（不早于今天） */
export function notBeforeToday(message: string = '不能早于今天'): Validator<string> {
    return (value: string) => {
        if (!value) return undefined;
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return message;
        }
        return undefined;
    };
}

/** 日期范围验证（结束日期不早于开始日期） */
export function dateRange(startDateField: string, message: string = '结束日期不能早于开始日期'): Validator<string> {
    return (value: string, formData?: Record<string, unknown>) => {
        if (!value || !formData) return undefined;
        const startDate = formData[startDateField] as string;
        if (!startDate) return undefined;
        if (value < startDate) {
            return message;
        }
        return undefined;
    };
}

/** 验证表单数据 */
export function validateForm<T extends Record<string, unknown>>(
    data: T,
    rules: Record<keyof T, Validator<unknown>>
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
    const errors: Partial<Record<keyof T, string>> = {};
    
    for (const [field, validator] of Object.entries(rules) as [keyof T, Validator<unknown>][]) {
        const error = validator(data[field], data);
        if (error) {
            errors[field] = error;
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}
