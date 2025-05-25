<script lang="ts">
    import type { Container } from '$lib';
    let { data } = $props<{
        containers: Array<Container>
    }>();
</script>

<h1>容器列表</h1>
<ul>
    {#each data.containers as { id, fastCode, mark }}
        <li>
            <p><a href={`/containers/${id}`}>{fastCode}</a> {mark}</p>
        </li>
    {/each}
</ul>