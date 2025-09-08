<script lang="ts">
    import type { BaseItem } from '$lib';
    let { data } = $props<{ items: BaseItem[] }>();
</script>

<svelte:head>
    <title>所有商品</title>
</svelte:head>
<div class="content-container">
    <ul>
        <div class="section-header">
            <h3>所有商品</h3>
            <a href="/item/add" class="edit-link">添加商品</a>
        </div>

        {#each data.items as { id, SKU, name }}
            <li><a href={`/item/${id}`}>{SKU}</a> {name}</li>
        {/each}
    </ul>
</div>


<style>
    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .section-header h3 {
        margin: 0;
        color: #333;
    }

    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>
