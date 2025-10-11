<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
	
	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/container/A', label: 'Container' },
		{ href: '/item', label: 'Items' },
		{ href: '/category/4', label: 'Categories' }
	];
</script>

<nav class="main-nav">
	{#each navItems as item}
		<a href={item.href} class="nav-link">{item.label}</a>
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
	}
	
	.nav-link {
		color: #007bff;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s ease;
	}
	
	.nav-link:hover {
		background-color: #e9ecef;
		text-decoration: none;
	}
</style>
