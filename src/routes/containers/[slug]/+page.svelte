<script lang="ts">
// 由于找不到 ContainerResponse 类型，这里先使用 any 类型临时替代
    import type { Container } from '$lib';
    let { data } = $props<{
        container: Container;
    }>();
</script>

<!-- 修改这里，显示具体属性 -->
<h1>{data.container.fastCode}</h1>
<!-- 由于 data.container 是单个对象，不是数组，不需要使用 each 循环 -->
<li><a href={`/items/${data.container.id}`}>{data.container.fastCode}</a> {data.container.mark} </li>
