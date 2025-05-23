<script lang="ts">
    import type { Items } from '$lib';
    let { data } = $props<{ items: Items[] }>();
</script>

<h1>Items</h1>
{#if data.items.length > 0}
    <ul>
        {#each data.items as { id, SKU, name }}
            <li><a href={`/items/${id}`}>{SKU}</a> - {name}</li>
        {/each}
    </ul>
{:else}
    <p>正在加载物品列表...</p>
{/if}
<p>this is the Items page.</p>
<mcfile name="+page.svelte" path="e:\anyWarehouse_front\src\routes\items\+page.svelte"></mcfile>
