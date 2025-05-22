<script lang="ts">
    import type { CategoryResponse } from '$lib';
    let { data } = $props<{ category_items: CategoryResponse }>();
</script>

<h1>{data.category_items.name}</h1>
<ul>
    {#each data.category_items.items as { id, SKU, name }}
		<li><a href={`/items/${id}`}>{SKU}</a> {name} </li>
	{/each}
</ul>
<mcfile name="+page.svelte" path="e:\anyWarehouse_front\src\routes\categories\[slug]\+page.svelte"></mcfile>