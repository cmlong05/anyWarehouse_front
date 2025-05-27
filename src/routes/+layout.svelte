<script lang="ts">
	let { children } = $props();
</script>


<nav>
	<a href="/">home</a>
<!-- 为确保页面刷新，添加 data-sveltekit-reload 属性 -->
	<a href="/container/Office" >Container</a>
	<a href="/items">Items</a>
	<a href="/categories">Categories</a>
</nav> 

{@render children()}
