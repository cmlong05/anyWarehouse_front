<script lang="ts">
	let { children } = $props();
</script>


<nav>
	<a href="/">home</a>
	<a href="/container/">Container</a>
	<a href="/items">Items</a>
	<a href="/categories">Categories</a>
</nav>

{@render children()}
