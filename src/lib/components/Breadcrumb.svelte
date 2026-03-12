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

<nav class="mb-4 text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center gap-2 list-none m-0 p-0">
        {#each items as item, i}
            <li class="flex items-center gap-2">
                {#if item.href}
                    <a href={item.href} class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        {item.label}
                    </a>
                {:else}
                    <span class="text-gray-500 font-medium" aria-current="page">
                        {item.label}
                    </span>
                {/if}
                {#if i < items.length - 1}
                    <span class="text-gray-500 mx-1" aria-hidden="true">&gt;</span>
                {/if}
            </li>
        {/each}
    </ol>
</nav>
