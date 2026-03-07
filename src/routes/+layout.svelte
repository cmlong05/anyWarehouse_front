<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	
	let { children } = $props();
	
	interface NavItem {
		href: string;
		label: string;
		children?: { href: string; label: string }[];
	}
	
	const navItems: NavItem[] = [
		{ href: '/', label: 'Home' },
		{ href: '/container/A', label: 'Container' },
		{
			href: '/item/category/4',
			label: 'Categories',
			children: [
				{ href: '/item/category/4', label: '分类列表' },
				{ href: '/item', label: '物品列表' }
			]
		},
		{
			href: '/supplier',
			label: '供应商',
			children: [
				{ href: '/supplier', label: '供应商列表' },
				{ href: '/supplier/purchase-order', label: '采购订单' }
			]
		},
		{
			href: '/customer',
			label: '客户管理',
			children: [
				{ href: '/customer', label: '客户列表' },
				{ href: '/customer/sales-order', label: '销售订单' },
				{ href: '/customer/shipment', label: '发货管理' },
				{ href: '/customer/package', label: '包裹管理' },
				{ href: '/customer/shipment/tracking-number', label: '快递单号' }
			]
		}
	];
	
	// 移动端菜单状态
	let mobileMenuOpen = $state(false);
	// 移动端展开的子菜单索引
	let expandedMobileItems = $state<Set<number>>(new Set());
	// 桌面端展开的下拉菜单索引
	let openDropdownIndex = $state<number | null>(null);
	// 关闭定时器 ID
	let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function toggleMobileSubmenu(index: number) {
		const newSet = new Set(expandedMobileItems);
		if (newSet.has(index)) {
			newSet.delete(index);
		} else {
			newSet.add(index);
		}
		expandedMobileItems = newSet;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
	
	function openDropdown(index: number) {
		openDropdownIndex = index;
	}
	
	function closeDropdown() {
		// 延迟关闭，允许鼠标移动到菜单上
		closeTimeoutId = setTimeout(() => {
			openDropdownIndex = null;
		}, 150);
	}
	
	function cancelCloseDropdown() {
		// 取消定时关闭
		if (closeTimeoutId) {
			clearTimeout(closeTimeoutId);
			closeTimeoutId = null;
		}
	}
	
	
</script>

<div class="relative">
	<nav class="sticky top-0 z-[1000] bg-white border-b border-gray-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-10">
				<!-- Logo / Brand -->
				<div class="flex items-center">
					<a href="/" class="flex items-center text-blue-600 hover:text-blue-700 transition-colors" aria-label="首页">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
						</svg>
					</a>
				</div>
				
				<!-- Desktop Navigation -->
				<div class="hidden md:flex items-center space-x-1">
					{#each navItems as item, index}
						{#if item.children}
							<!-- Desktop Dropdown -->
							<div class="relative" role="group" onmouseenter={cancelCloseDropdown} onmouseleave={closeDropdown}>
								<a 
									href={item.href}
									class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
									onmouseenter={() => openDropdown(index)}
									aria-expanded={openDropdownIndex === index}
								>
									{item.label}
									<svg class="w-4 h-4 transition-transform {openDropdownIndex === index ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</a>
								{#if openDropdownIndex === index}
									<!-- Dropdown Menu -->
									<div 
										class="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
										style="z-index: 9999;"
										role="menu"
										tabindex="-1"
									>
										{#each item.children as child}
											<a href={child.href} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">
												{child.label}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<!-- Desktop Simple Link -->
							<a href={item.href} class="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors">
								{item.label}
							</a>
						{/if}
					{/each}
				</div>
				
				<!-- Mobile Menu Button -->
				<div class="flex items-center md:hidden">
					<button 
						onclick={toggleMobileMenu}
						class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
						aria-expanded={mobileMenuOpen}
					>
						<span class="sr-only">打开菜单</span>
						{#if mobileMenuOpen}
							<!-- X Icon -->
							<svg class="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{:else}
							<!-- Menu Icon -->
							<svg class="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
		
		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden bg-white border-t border-gray-200">
				<div class="px-2 pt-2 pb-3 space-y-1">
					{#each navItems as item, index}
						{#if item.children}
							<!-- Mobile Dropdown -->
							<div class="space-y-1">
								<button 
									onclick={() => toggleMobileSubmenu(index)}
									class="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
								>
									<span>{item.label}</span>
									<svg class="w-5 h-5 transition-transform duration-200 {expandedMobileItems.has(index) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{#if expandedMobileItems.has(index)}
									<div class="pl-4 space-y-1">
										{#each item.children as child}
											<a 
												href={child.href} 
												onclick={closeMobileMenu}
												class="block px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
											>
												{child.label}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<!-- Mobile Simple Link -->
							<a 
								href={item.href} 
								onclick={closeMobileMenu}
								class="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
							>
								{item.label}
							</a>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</nav>
	
	<main class="min-h-screen bg-gray-50 relative" style="z-index: 1;">
		{@render children()}
	</main>
</div>
