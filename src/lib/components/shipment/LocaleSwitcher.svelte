<script lang="ts">
    import { localeStore, setLocale, type Locale } from '$lib/i18n/common';
    
    interface Props {
        variant?: 'button' | 'select' | 'tabs';
    }
    
    let { variant = 'button' }: Props = $props();
    
    function switchLocale(locale: Locale) {
        setLocale(locale);
        localeStore.set(locale);
    }
    
    const locales: { value: Locale; label: string; flag: string }[] = [
        { value: 'zh', label: '中文', flag: '🇨🇳' },
        { value: 'en', label: 'English', flag: '🇺🇸' }
    ];
</script>

{#if variant === 'button'}
    <div class="flex gap-2 items-center">
        {#each locales as loc}
            <button
                class="flex items-center justify-center w-8 h-8 p-0 border border-gray-200 rounded-md bg-white text-gray-500 text-sm cursor-pointer transition-all duration-150 ease-in-out hover:border-gray-300 hover:bg-gray-50"
                class:border-blue-500={$localeStore === loc.value}
                class:bg-blue-50={$localeStore === loc.value}
                class:text-blue-700={$localeStore === loc.value}
                class:font-medium={$localeStore === loc.value}
                onclick={() => switchLocale(loc.value)}
                title={loc.label}
            >
                <span class="text-base">{loc.flag}</span>
            </button>
        {/each}
    </div>
{:else if variant === 'select'}
    <select 
        class="py-2 pl-3 pr-8 border border-gray-200 rounded-md bg-white text-sm cursor-pointer appearance-none bg-no-repeat bg-right"
        style="background-image: url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e&quot;); background-position: right 0.5rem center; background-size: 1.5em 1.5em;"
        value={$localeStore}
        onchange={(e) => switchLocale((e.target as HTMLSelectElement).value as Locale)}
    >
        {#each locales as loc}
            <option value={loc.value}>{loc.flag} {loc.label}</option>
        {/each}
    </select>
{:else if variant === 'tabs'}
    <div class="flex border border-gray-200 rounded-md overflow-hidden">
        {#each locales as loc, index}
            <button
                class="py-2 px-4 border-0 bg-white text-gray-500 text-sm cursor-pointer transition-all duration-150 ease-in-out hover:bg-gray-50"
                class:border-r={index !== locales.length - 1}
                class:border-gray-200={index !== locales.length - 1}
                class:bg-blue-500={$localeStore === loc.value}
                class:text-white={$localeStore === loc.value}
                class:font-medium={$localeStore === loc.value}
                onclick={() => switchLocale(loc.value)}
            >
                {loc.flag} {loc.label}
            </button>
        {/each}
    </div>
{/if}
