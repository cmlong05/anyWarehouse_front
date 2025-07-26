<script lang="ts">
    import type { ContainerBriefID } from '$lib';

    interface Props {
        data: {
            containers: ContainerBriefID[];
        };
        children: import('svelte').Snippet;
    }
    
    let { data, children }: Props = $props();
</script>

<div class="storage-layout">
    <header class="storage-header">
        <h1>存储管理</h1>
    </header>

    <main class="storage-main">
        {@render children()}
    </main>
</div>
