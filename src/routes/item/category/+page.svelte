<script lang="ts">
    import type { Category } from '$lib';
    let { data } = $props<{ categories: Category[] }>();
</script>

<svelte:head>
    <title>所有分类</title>
</svelte:head>

<div class="content-container">
    <div class="section-header">
        <h3>所有分类</h3>
        <a href="/category/add" class="edit-link">添加分类</a>
    </div>

    {#if data.categories.length > 0}
        <div class="categories-grid">
            {#each data.categories as category}
                <div class="category-card">
                    <a href="/category/{category.id}" class="category-link">
                        <h4>{category.name}</h4>
                        {#if category.description}
                            <p class="category-description">{category.description}</p>
                        {/if}
                        <div class="category-meta">
                            <span class="category-id">ID: {category.id}</span>
                            {#if category.parent}
                                <span class="category-parent">父分类: {category.parent}</span>
                            {/if}
                        </div>
                    </a>
                </div>
            {/each}
        </div>
    {:else}
        <div class="empty-state">
            <p>暂无分类</p>
            <a href="/category/add" class="btn btn-primary">添加第一个分类</a>
        </div>
    {/if}
</div>

<style>
    .content-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    .section-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
    }

    .edit-link {
        background-color: #007bff;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: background-color 0.15s ease;
    }

    .edit-link:hover {
        background-color: #0056b3;
    }

    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .category-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .category-link {
        display: block;
        padding: 1.5rem;
        text-decoration: none;
        color: inherit;
    }

    .category-link h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.2rem;
    }

    .category-description {
        color: #666;
        margin: 0 0 1rem 0;
        line-height: 1.4;
        font-size: 0.9rem;
    }

    .category-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.8rem;
        color: #888;
    }

    .category-id,
    .category-parent {
        font-family: monospace;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #666;
    }

    .empty-state p {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
    }

    .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0056b3;
    }

    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .categories-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .category-card {
            margin-bottom: 0;
        }
    }
</style>
