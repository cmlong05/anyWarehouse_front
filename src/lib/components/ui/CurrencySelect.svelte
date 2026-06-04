<!-- 币种选择器 -->
<script lang="ts">
    interface Props {
        value?: string;
        id?: string;
        onchange?: (value: string) => void;
    }
    
    let {
        value = $bindable('CNY'),
        id = 'currency',
        onchange
    }: Props = $props();
    
    const currencies = [
        { code: 'CNY', name: 'CNY' },
        { code: 'USD', name: 'USD' },
        { code: 'EUR', name: 'EUR' },
        { code: 'GBP', name: 'GBP' },
        { code: 'JPY', name: 'JPY' },
    ];
    
    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        value = target.value;
        onchange?.(value);
    }
</script>

<select
    {id}
    bind:value
    onchange={handleChange}
    class="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
>
    {#each currencies as currency}
        <option value={currency.code}>{currency.name}</option>
    {/each}
</select>
