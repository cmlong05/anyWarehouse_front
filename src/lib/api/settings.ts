/**系统设置 API */
import { config } from '$lib/config';
import { ApiClient } from './client';

export interface SystemSettingResponse {
    pi_company_name: string;
    pi_company_address: string;
    pi_payment_terms: string;
    pi_delivery_terms: string;
    pi_notes: string;
    purchase_order_shipping_address: string;
    purchase_order_contact_person: string;
    purchase_order_contact_phone: string;
    created_at: string;
    updated_at: string;
    updated_by_username: string | null;
}

export interface PIDefaults {
    company_name: string;
    company_address: string;
    payment_terms: string;
    delivery_terms: string;
    notes: string;
    purchase_order_shipping_address: string;
    purchase_order_contact_person: string;
    purchase_order_contact_phone: string;
}

export interface SystemSettingUpdateRequest {
    pi_company_name?: string;
    pi_company_address?: string;
    pi_payment_terms?: string;
    pi_delivery_terms?: string;
    pi_notes?: string;
    purchase_order_shipping_address?: string;
    purchase_order_contact_person?: string;
    purchase_order_contact_phone?: string;
}

export class SystemSettingAPI {
    private client: ApiClient;
    private basePath = '/index/system-settings/';

    constructor() {
        this.client = new ApiClient(config.API_BASE_URL);
    }

    /**获取完整系统设置（登录用户可读）*/
    async get(): Promise<SystemSettingResponse> {
        return this.client.get(this.basePath);
    }

    /**更新系统设置（管理员专用）*/
    async update(data: SystemSettingUpdateRequest): Promise<SystemSettingResponse> {
        return this.client.put(`${this.basePath}1/`, data);
    }

    /**获取 PI 默认值（公开读取，前端专用）*/
    async getPIDefaults(): Promise<PIDefaults> {
        return this.client.get(`${this.basePath}pi_defaults/`);
    }
}

export const systemSettingAPI = new SystemSettingAPI();
