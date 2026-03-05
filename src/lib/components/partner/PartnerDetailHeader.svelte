<script lang="ts">
    interface Props {
        name: string;
        level: string;
        status: string;
        isEditing: boolean;
        levelLabel: string;
        statusLabel: string;
        onEdit: () => void;
        onCancel: () => void;
        onDelete: () => void;
    }
    
    let { name, level, status, isEditing, levelLabel, statusLabel, onEdit, onCancel, onDelete }: Props = $props();
</script>

<div class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 max-md:flex-col max-md:items-start max-md:gap-4">
    {#if isEditing}
        <h1 class="m-0 text-2xl font-bold text-gray-900">编辑</h1>
        <button 
            class="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition-colors max-md:w-full"
            onclick={onCancel}
        >
            取消编辑
        </button>
    {:else}
        <div class="flex items-center gap-3 flex-wrap">
            <h1 class="m-0 text-2xl font-bold text-gray-900">{name}</h1>
            <span class="px-2 py-1 rounded text-xs font-medium
                {level.toLowerCase() === 'vip' || level.toLowerCase() === 'a' ? 'bg-amber-100 text-amber-800' : ''}
                {level.toLowerCase() === 'normal' || level.toLowerCase() === 'b' ? 'bg-blue-100 text-blue-800' : ''}
                {level.toLowerCase() === 'temp' || level.toLowerCase() === 'c' ? 'bg-gray-100 text-gray-600' : ''}
            ">{levelLabel}</span>
            <span class="px-2 py-1 rounded text-xs font-medium
                {status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : ''}
                {status.toLowerCase() === 'inactive' ? 'bg-red-100 text-red-800' : ''}
            ">{statusLabel}</span>
        </div>
        <div class="flex gap-2 max-md:w-full">
            <button 
                class="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                onclick={onEdit}
                aria-label="编辑"
                title="编辑"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        </div>
    {/if}
</div>
