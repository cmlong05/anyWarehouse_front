<script lang="ts">
	let { data } = $props<{
		items: Array<{ id: number; SKU: string; name: string }>
	}>();
</script>

<h1>子物品</h1>
<ul>
    {#each data.items as { id,SKU,name }}
		<li><a href={`/items/${id}`}>{SKU}</a> {name} </li>
	{/each}
</ul>