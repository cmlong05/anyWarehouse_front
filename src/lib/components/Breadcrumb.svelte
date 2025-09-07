<script lang="ts">
    interface BreadcrumbItem {
        label: string;
        href?: string;
    }
    
    interface Props {
        items: BreadcrumbItem[];
    }
    
    let { items }: Props = $props();
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
        {#each items as item, i}
            <li class="breadcrumb-item">
                {#if item.href}
                    <a href={item.href} class="breadcrumb-link">
                        {item.label}
                    </a>
                {:else}
                    <span class="breadcrumb-current" aria-current="page">
                        {item.label}
                    </span>
                {/if}
                {#if i < items.length - 1}
                    <span class="breadcrumb-separator" aria-hidden="true">&gt;</span>
                {/if}
            </li>
        {/each}
    </ol>
</nav>

<style>
    .breadcrumb {
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }
    
    .breadcrumb-list {
        display: flex;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 0.5rem;
    }
    
    .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .breadcrumb-link {
        color: #007bff;
        text-decoration: none;
        transition: color 0.2s ease;
    }
    
    .breadcrumb-link:hover {
        color: #0056b3;
        text-decoration: underline;
    }
    
    .breadcrumb-current {
        color: #6c757d;
        font-weight: 500;
    }
    
    .breadcrumb-separator {
        color: #6c757d;
        margin: 0 0.25rem;
    }
</style>
