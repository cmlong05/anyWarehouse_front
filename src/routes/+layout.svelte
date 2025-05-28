<script lang="ts">
	let { children } = $props();
</script>


<nav>
	<a href="/">home</a>
	<a href="/container/Office" >Container</a>
	<a href="/items">Items</a>
	<a href="/categories/4">Categories</a>
</nav> 

{@render children()}
