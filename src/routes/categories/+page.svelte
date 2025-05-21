<script lang="ts">
	// Accept 'data' as a prop with a 'categories' property
	export let data: { categories: Array<{ id: number; name: string }> };
</script>

<h1>Categories</h1>
<ul>
	{#each data.categories as { id, name }}
		<li><a href={`/categories/${id}`}>{name}</a></li>
	{/each}
</ul>