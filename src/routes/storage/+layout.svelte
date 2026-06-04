<!-- 应用布局 -->
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
    <main class="storage-main">
        {@render children()}
    </main>
</div>
