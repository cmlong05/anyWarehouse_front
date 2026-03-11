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
    <div class="locale-switcher">
        {#each locales as loc}
            <button
                class="locale-btn"
                class:active={$localeStore === loc.value}
                onclick={() => switchLocale(loc.value)}
                title={loc.label}
            >
                <span class="flag">{loc.flag}</span>
            </button>
        {/each}
    </div>
{:else if variant === 'select'}
    <select 
        class="locale-select"
        value={$localeStore}
        onchange={(e) => switchLocale((e.target as HTMLSelectElement).value as Locale)}
    >
        {#each locales as loc}
            <option value={loc.value}>{loc.flag} {loc.label}</option>
        {/each}
    </select>
{:else if variant === 'tabs'}
    <div class="locale-tabs">
        {#each locales as loc}
            <button
                class="locale-tab"
                class:active={$localeStore === loc.value}
                onclick={() => switchLocale(loc.value)}
            >
                {loc.flag} {loc.label}
            </button>
        {/each}
    </div>
{/if}

<style>
    .locale-switcher {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .locale-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: white;
        color: #6b7280;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .locale-btn:hover {
        border-color: #d1d5db;
        background: #f9fafb;
    }
    
    .locale-btn.active {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 500;
    }
    
    .flag {
        font-size: 1rem;
    }
    
    .locale-select {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: white;
        font-size: 0.875rem;
        cursor: pointer;
    }
    
    .locale-tabs {
        display: flex;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        overflow: hidden;
    }
    
    .locale-tab {
        padding: 0.5rem 1rem;
        border: none;
        background: white;
        color: #6b7280;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .locale-tab:not(:last-child) {
        border-right: 1px solid #e5e7eb;
    }
    
    .locale-tab:hover {
        background: #f9fafb;
    }
    
    .locale-tab.active {
        background: #3b82f6;
        color: white;
        font-weight: 500;
    }
</style>
