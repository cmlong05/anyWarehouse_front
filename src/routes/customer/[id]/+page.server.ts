// 加载客户详情数据
import type { PageServerLoad } from './$types';
import { fetchCustomerById } from './customer-loader';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const customer = await fetchCustomerById(params.id, fetch);

    return {
        customer
    };
};