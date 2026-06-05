<!-- 报价信息卡片 -->
<!--
被依赖：
- `routes/customer/quotation/[id]/edit/+page.svelte`
- `routes/supplier/quotation/[id]/edit/+page.svelte`
-->
<script lang="ts">
    interface Props {
        validFrom?: string | null;
        validUntil?: string | null;
        note?: string;
        isPreferred?: boolean;
        showValidUntil?: boolean;
        showPreferred?: boolean;
        onValidFromChange: (value: string) => void;
        onValidUntilChange?: (value: string) => void;
        onNoteChange: (value: string) => void;
        onPreferredChange?: (value: boolean) => void;
    }

    let {
        validFrom = null,
        validUntil = null,
        note = '',
        isPreferred = false,
        showValidUntil = false,
        showPreferred = false,
        onValidFromChange,
        onValidUntilChange,
        onNoteChange,
        onPreferredChange,
    }: Props = $props();
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        有效期和其他
    </h2>

    {#if showPreferred}
        <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                    type="checkbox"
                    checked={isPreferred}
                    onchange={(e) => onPreferredChange?.((e.currentTarget as HTMLInputElement).checked)}
                    class="w-auto"
                />
                设为首选报价
            </label>
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
            <label for="valid_from" class="block text-sm font-medium text-gray-700 mb-2">有效期开始</label>
            <input
                type="date"
                id="valid_from"
                value={validFrom || ''}
                oninput={(e) => onValidFromChange((e.currentTarget as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>

        {#if showValidUntil}
            <div>
                <label for="valid_until" class="block text-sm font-medium text-gray-700 mb-2">有效期结束</label>
                <input
                    type="date"
                    id="valid_until"
                    value={validUntil || ''}
                    oninput={(e) => onValidUntilChange?.((e.currentTarget as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        {/if}
    </div>

    <div>
        <label for="note" class="block text-sm font-medium text-gray-700 mb-2">备注</label>
        <textarea
            id="note"
            rows="3"
            value={note}
            oninput={(e) => onNoteChange((e.currentTarget as HTMLTextAreaElement).value)}
            placeholder="添加关于此报价的备注信息..."
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        ></textarea>
    </div>
</div>