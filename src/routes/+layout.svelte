<script>
	let { children } = $props();
</script>


<nav>
	<a href="/">home</a>
	<a href="/containers">Containers</a>
</nav>

{@render children()}
