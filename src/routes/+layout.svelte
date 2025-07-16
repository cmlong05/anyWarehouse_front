<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>


<nav>
	<a href="/">Home</a>
	<a href="/container/A" >Container</a>
	<a href="/item">Items</a>
	<a href="/category/4">Categories</a>
</nav> 

{@render children()}
