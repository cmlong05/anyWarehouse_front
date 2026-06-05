// 加载客户编辑数据
// 被依赖：无
import type { PageServerLoad } from './$types';
import { fetchCustomerById } from '../customer-loader';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const customer = await fetchCustomerById(params.id, fetch);

    return {
        customer
    };
};