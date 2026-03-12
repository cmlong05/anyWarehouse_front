<script lang="ts">
    interface Props {
        size?: 'small' | 'medium' | 'large';
        text?: string;
        inline?: boolean;
    }
    
    let { 
        size = 'medium',
        text = '加载中...',
        inline = false
    }: Props = $props();
    
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };
</script>

<div class="flex items-center justify-center gap-3 {inline ? 'flex-row p-2' : 'flex-col p-8'}">
    <div class="{sizeClasses[size]} rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin"></div>
    {#if text}
        <span class="text-gray-500 text-sm">{text}</span>
    {/if}
</div>
