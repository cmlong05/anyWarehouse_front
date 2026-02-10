<script lang="ts">
	import '../app.css';
	
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
			href: '/category/4',
			label: 'Categories',
			children: [
				{ href: '/category/4', label: '分类列表' },
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
		}
	];
	

</script>

<nav class="main-nav">
	{#each navItems as item}
		{#if item.children}
			<div class="nav-item has-dropdown">
				<a href={item.href} class="nav-link dropdown-toggle">
					{item.label}
					<span class="arrow">▼</span>
				</a>
				<div class="dropdown-menu">
					{#each item.children as child}
						<a href={child.href} class="dropdown-link">{child.label}</a>
					{/each}
				</div>
			</div>
		{:else}
			<a href={item.href} class="nav-link">{item.label}</a>
		{/if}
	{/each}
</nav> 

{@render children()}

<style>
	.main-nav {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		position: relative;
		z-index: 1000;
	}
	
	.nav-link {
		color: #007bff;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s ease;
		background: none;
		border: none;
		font-size: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.nav-link:hover {
		background-color: #e9ecef;
		text-decoration: none;
	}
	
	.nav-item {
		position: relative;
	}
	
	.dropdown-toggle .arrow {
		font-size: 0.7em;
		transition: transform 0.2s ease;
	}
	
	.nav-item:hover .arrow {
		transform: rotate(180deg);
	}
	
	/* 悬停时按钮去掉底部圆角，与菜单连接 */
	.nav-item:hover .dropdown-toggle {
		border-radius: 0.25rem 0.25rem 0 0;
		background-color: #e9ecef;
	}
	
	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		background-color: white;
		border: 1px solid #dee2e6;
		border-top: none;
		border-radius: 0 0 0.25rem 0.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 140px;
		z-index: 1001;
		pointer-events: none;
		visibility: hidden;
		opacity: 0;
		transition: opacity 0.15s ease, visibility 0.15s ease;
	}
	
	/* 纯 CSS hover 显示菜单并启用交互 */
	.nav-item:hover .dropdown-menu {
		pointer-events: auto;
		visibility: visible;
		opacity: 1;
	}
	
	.dropdown-link {
		display: block;
		padding: 0.5rem 1rem;
		color: #333;
		text-decoration: none;
		white-space: nowrap;
		transition: background-color 0.2s ease;
	}
	
	.dropdown-link:hover {
		background-color: #f8f9fa;
		color: #007bff;
	}
	
	.dropdown-link:first-child {
		border-radius: 0.25rem 0.25rem 0 0;
	}
	
	.dropdown-link:last-child {
		border-radius: 0 0 0.25rem 0.25rem;
	}
</style>
