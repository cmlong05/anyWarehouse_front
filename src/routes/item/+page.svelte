<script lang="ts">
    import type { Items } from '$lib';
    let { data } = $props<{ items: Items[] }>();
</script>

{#if data.items.length > 0}
    <ul>
        {#each data.items as { id, SKU, name }}
            <li><a href={`/item/${id}`}>{SKU}</a> - {name}</li>
        {/each}
    </ul>
{/if}

<mcfile name="+page.svelte" path="e:\anyWarehouse_front\src\routes\items\+page.svelte"></mcfile>
