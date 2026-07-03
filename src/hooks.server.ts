/**
 * SSR 鉴权守卫
 *
 * 拦截所有非公开路由请求，通过 sessionid cookie 验证登录态。
 * 公开路由：/login
 * 未登录用户自动重定向到 /login?redirect=<原始路径>
 */
import type { Handle } from '@sveltejs/kit';
import { config } from '$lib/config';

const PUBLIC_ROUTES = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	if (PUBLIC_ROUTES.includes(pathname)) {
		return resolve(event);
	}

	// Check auth via session cookie
	const sessionid = event.cookies.get('sessionid');
	if (!sessionid) {
		return Response.redirect(`${event.url.origin}/login?redirect=${encodeURIComponent(pathname)}`, 302);
	}

	// Verify session is valid by calling /api/auth/me/
	try {
		const apiUrl = config.API_BASE_URL;
		const res = await fetch(`${apiUrl}/auth/me/`, {
			headers: { cookie: `sessionid=${sessionid}` },
		});
		if (!res.ok) {
			return Response.redirect(`${event.url.origin}/login?redirect=${encodeURIComponent(pathname)}`, 302);
		}

		const user = await res.json();
		event.locals.user = user;
	} catch {
		return Response.redirect(`${event.url.origin}/login?redirect=${encodeURIComponent(pathname)}`, 302);
	}

	return resolve(event);
};
