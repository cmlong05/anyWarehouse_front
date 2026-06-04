<!-- 系统设置页 -->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/settings/pi');
    });
</script>

<div class="min-h-screen flex items-center justify-center p-6">
    <div class="text-center">
        <p class="text-lg font-medium text-gray-900">正在跳转到设置页面...</p>
        <p class="text-sm text-gray-500 mt-2">如果未自动跳转，请 <a class="text-blue-600 hover:underline" href="/settings/pi">点击这里</a>。</p>
    </div>
</div>
