<script lang="ts">
    interface InfoItem {
        label: string;
        value: string;
        isCode?: boolean;
    }
    
    interface Props {
        title: string;
        items: InfoItem[];
        fullWidth?: boolean;
    }
    
    let { title, items, fullWidth = false }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200" class:col-span-full={fullWidth}>
    <h3 class="m-0 mb-4 text-lg text-gray-700 pb-3 border-b border-gray-200">{title}</h3>
    <div class="flex flex-col gap-3">
        {#each items as item}
            <div class="flex justify-between items-start gap-4">
                <span class="text-gray-500 text-sm flex-shrink-0">{item.label}</span>
                <span class="text-gray-800 text-right break-words" class:font-mono={item.isCode} class:text-gray-500={item.isCode}>{item.value || '-'}</span>
            </div>
        {/each}
    </div>
</div>
