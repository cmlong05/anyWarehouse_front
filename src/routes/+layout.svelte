<script>
	let { children } = $props();
</script>


<nav>
	<a href="/">home</a>
	<a href="/containers">Containers</a>
	<a href="/items">Items</a>
	<a href="/categorys">Categories</a>
</nav>

{@render children()}
