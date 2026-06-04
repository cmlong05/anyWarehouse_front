<!-- 物料属性管理页 -->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import AttributeManager from '$lib/components/AttributeManager.svelte';
</script>

<svelte:head>
    <title>属性管理 | 变体属性</title>
</svelte:head>

<PageContainer>
    <PageHeader 
        title="属性管理"
        subtitle="管理变体属性（颜色、尺寸等）及其可选值"
    />
    
    <div class="max-w-2xl">
        <AttributeManager showManage={true} />
    </div>
</PageContainer>