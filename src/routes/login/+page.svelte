<!--
登录页面

GET 预检获取 CSRF cookie，POST 提交用户名密码到 /api/auth/login/。
登录成功后根据 redirect 参数跳转，失败则显示错误信息。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let error = $state('');
	let submitting = $state(false);

	const loginUrl = `${config.API_BASE_URL}/auth/login/`;

	onMount(() => {
		// Prefetch CSRF cookie in background (non-blocking)
		fetch(loginUrl, { method: 'GET', credentials: 'include' }).catch(() => {});
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const res = await fetch(loginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCsrfToken(),
				},
				credentials: 'include',
				body: JSON.stringify({
					username: formData.get('username'),
					password: formData.get('password'),
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				error = data.detail || '登录失败';
				submitting = false;
				return;
			}

			const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
			window.location.href = redirect;
		} catch (err) {
			error = `网络错误，请重试: ${(err as Error).message}`;
			submitting = false;
		}
	}

	function getCsrfToken(): string {
		const match = document.cookie.match(/csrftoken=([^;]+)/);
		return match ? match[1] : '';
	}
</script>

<svelte:head>
	<title>登录 - AnyWarehouse</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
	<div class="w-full max-w-sm">
		<div class="bg-white rounded-lg shadow-md px-8 pt-8 pb-6">
			<div class="text-center mb-6">
				<svg class="w-10 h-10 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
				</svg>
				<h1 class="text-xl font-semibold text-gray-800">AnyWarehouse</h1>
			</div>

			<form onsubmit={handleSubmit}>
				<div class="mb-4">
					<label for="username" class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						autocomplete="username"
						class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="请输入用户名"
					/>
				</div>

				<div class="mb-5">
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">密码</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
						class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="请输入密码"
					/>
				</div>

				{#if error}
					<div class="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={submitting}
					class="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if submitting}
						登录中...
					{:else}
						登录
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
