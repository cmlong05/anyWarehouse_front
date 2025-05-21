<script lang="ts">
	// 使用 $props() 解构并类型化 props
	let { data } = $props<{
		categories: Array<{ id: number; name: string }>
	}>();
</script>

<h1>Categories</h1>
<ul>
	{#each data.categories as { id, name }}
		<li><a href={`/categories/${id}`}>{name}</a></li>
	{/each}
</ul>