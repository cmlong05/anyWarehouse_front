/**
 * 根布局 load 函数
 *
 * 将 hooks.server.ts 中解析出的用户信息传递给所有页面的 data.user。
 */
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user || null,
	};
};
