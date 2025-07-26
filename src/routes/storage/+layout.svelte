<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';

    interface Props {
        containers: ContainerBriefID[];
        children: import('svelte').Snippet;
    }
    
    let { containers, children }: Props = $props();
</script>

<div class="storage-layout">
    <header>
        <h1>存储管理</h1>
    </header>

    <main>
        {@render children()}
    </main>
</div>
