<!-- 系统设置页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { systemSettingAPI } from '$lib/api';
    import { Alert, Loading } from '$lib/components';

    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    let aliexpressBaseUrl = $state('');
    let aliexpressUrlSuffix = $state('');
    let ebayBaseUrl = $state('');
    let ebayUrlSuffix = $state('');
    let savedAliexpressBaseUrl = $state('');
    let savedAliexpressUrlSuffix = $state('');
    let savedEbayBaseUrl = $state('');
    let savedEbayUrlSuffix = $state('');
    let aliexpressSampleId = $state('1005001234567890');
    let ebaySampleId = $state('123456789012');
    let updatedAt = $state('');
    let updatedBy = $state('');

    function validateUrl(value: string): string | null {
        if (!value) return null;
        if (!/^https?:\/\//i.test(value)) return 'URL 必须以 http:// 或 https:// 开头';
        try { new URL(value); return null; } catch { return 'URL 格式不正确'; }
    }

    const trimmedAliexpress = $derived(aliexpressBaseUrl.trim());
    const trimmedEbay = $derived(ebayBaseUrl.trim());
    const trimmedAliexpressSuffix = $derived(aliexpressUrlSuffix.trim());
    const trimmedEbaySuffix = $derived(ebayUrlSuffix.trim());
    const aliexpressUrlError = $derived(validateUrl(trimmedAliexpress));
    const ebayUrlError = $derived(validateUrl(trimmedEbay));

    const isDirty = $derived(
        trimmedAliexpress !== savedAliexpressBaseUrl ||
        trimmedAliexpressSuffix !== savedAliexpressUrlSuffix ||
        trimmedEbay !== savedEbayBaseUrl ||
        trimmedEbaySuffix !== savedEbayUrlSuffix
    );
    const canSave = $derived(isDirty && !aliexpressUrlError && !ebayUrlError && !saving);

    function buildPreviewUrl(base: string, externalId: string, urlError: string | null, suffix: string = ''): string {
        const id = externalId.trim();
        if (!base || !id || urlError) return '';
        const normalizedBase = base.endsWith('/') ? base : `${base}/`;
        return `${normalizedBase}${encodeURIComponent(id)}${suffix}`;
    }

    const aliexpressPreviewUrl = $derived(buildPreviewUrl(trimmedAliexpress, aliexpressSampleId, aliexpressUrlError, trimmedAliexpressSuffix));
    const ebayPreviewUrl = $derived(buildPreviewUrl(trimmedEbay, ebaySampleId, ebayUrlError, trimmedEbaySuffix));

    function handleInput() {
        if (success) success = null;
    }

    function resetChanges() {
        aliexpressBaseUrl = savedAliexpressBaseUrl;
        aliexpressUrlSuffix = savedAliexpressUrlSuffix;
        ebayBaseUrl = savedEbayBaseUrl;
        ebayUrlSuffix = savedEbayUrlSuffix;
        error = null;
        success = null;
    }

    onMount(async () => {
        loading = true;
        error = null;
        try {
            const data = await systemSettingAPI.get();
            aliexpressBaseUrl = data.aliexpress_item_base_url || '';
            savedAliexpressBaseUrl = aliexpressBaseUrl.trim();
            aliexpressUrlSuffix = data.aliexpress_item_url_suffix || '';
            savedAliexpressUrlSuffix = aliexpressUrlSuffix.trim();
            ebayBaseUrl = data.ebay_item_base_url || '';
            savedEbayBaseUrl = ebayBaseUrl.trim();
            ebayUrlSuffix = data.ebay_item_url_suffix || '';
            savedEbayUrlSuffix = ebayUrlSuffix.trim();
            updatedAt = data.updated_at || '';
            updatedBy = data.updated_by_username || '-';
        } catch (err) {
            error = err instanceof Error ? err.message : '加载设置失败';
        } finally {
            loading = false;
        }
    });

    async function saveSettings(event?: SubmitEvent) {
        event?.preventDefault();
        if (!canSave) return;

        saving = true;
        error = null;
        success = null;
        try {
            const data = await systemSettingAPI.update({
                aliexpress_item_base_url: trimmedAliexpress,
                aliexpress_item_url_suffix: trimmedAliexpressSuffix,
                ebay_item_base_url: trimmedEbay,
                ebay_item_url_suffix: trimmedEbaySuffix,
            });
            aliexpressBaseUrl = data.aliexpress_item_base_url || '';
            savedAliexpressBaseUrl = aliexpressBaseUrl.trim();
            aliexpressUrlSuffix = data.aliexpress_item_url_suffix || '';
            savedAliexpressUrlSuffix = aliexpressUrlSuffix.trim();
            ebayBaseUrl = data.ebay_item_base_url || '';
            savedEbayBaseUrl = ebayBaseUrl.trim();
            ebayUrlSuffix = data.ebay_item_url_suffix || '';
            savedEbayUrlSuffix = ebayUrlSuffix.trim();
            updatedAt = data.updated_at || updatedAt;
            updatedBy = data.updated_by_username || updatedBy;
            success = '平台链接设置已保存';
            setTimeout(() => { success = null; }, 2500);
        } catch (err) {
            error = err instanceof Error ? err.message : '保存失败，请确认账号有管理员权限';
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>平台链接设置</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 sm:p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">平台链接设置</h1>
        <p class="text-sm text-gray-600 mt-1">配置各平台的基础 URL，用于 external_id 的自动拼接。</p>
    </div>

    {#if loading}
        <Loading />
    {:else}
        {#if error}
            <Alert {error} onDismiss={() => (error = null)} />
        {/if}

        {#if success}
            <div
                role="status"
                aria-live="polite"
                class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
                {success}
            </div>
        {/if}

        <form class="space-y-4" onsubmit={saveSettings}>
            <!-- AliExpress -->
            <div class="rounded-lg bg-white shadow p-4 sm:p-6 space-y-4">
                <h2 class="text-base font-semibold text-gray-800">AliExpress</h2>
                <div>
                    <label for="aliexpressBaseUrl" class="block text-sm text-gray-700 mb-1">基础 URL</label>
                    <input
                        id="aliexpressBaseUrl"
                        type="url"
                        inputmode="url"
                        autocomplete="off"
                        spellcheck="false"
                        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 {aliexpressUrlError
                            ? 'border-red-400 focus:ring-red-300'
                            : 'border-gray-300 focus:ring-blue-300'}"
                        bind:value={aliexpressBaseUrl}
                        oninput={handleInput}
                        placeholder="https://www.aliexpress.com/item/"
                        aria-invalid={aliexpressUrlError ? 'true' : 'false'}
                        aria-describedby="aliexpressHelp aliexpressError"
                    />
                    {#if aliexpressUrlError}
                        <p id="aliexpressError" class="mt-1 text-xs text-red-600">{aliexpressUrlError}</p>
                    {/if}
                    <p id="aliexpressHelp" class="mt-1 text-xs text-gray-500">
                        仅当链接平台为 AliExpress 且未填写完整 URL 时使用。留空表示禁用自动拼接。
                    </p>
                </div>
                <div>
                    <label for="aliexpressUrlSuffix" class="block text-sm text-gray-700 mb-1">URL 后缀</label>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-400">{'.../'}<code class="text-xs">{'{external_id}'}</code></span>
                        <input
                            id="aliexpressUrlSuffix"
                            type="text"
                            autocomplete="off"
                            spellcheck="false"
                            class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                            bind:value={aliexpressUrlSuffix}
                            oninput={handleInput}
                            placeholder=".html"
                        />
                    </div>
                    <p class="mt-1 text-xs text-gray-500">
                        拼接在 external_id 后面的后缀，例如 AliExpress 通常需要 .html。
                    </p>
                </div>
                <div class="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <div>
                        <label for="aliexpressSampleId" class="block text-xs font-medium text-gray-600 mb-1">预览 external_id</label>
                        <input
                            id="aliexpressSampleId"
                            type="text"
                            autocomplete="off"
                            spellcheck="false"
                            class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            bind:value={aliexpressSampleId}
                            placeholder="输入示例 external_id"
                        />
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 mb-1">预览结果</p>
                        {#if aliexpressPreviewUrl}
                            <a href={aliexpressPreviewUrl} target="_blank" rel="noopener noreferrer" class="text-xs break-all text-blue-600 hover:underline">
                                {aliexpressPreviewUrl} ↗
                            </a>
                        {:else if aliexpressUrlError}
                            <div class="text-xs text-gray-400">请先修正基础 URL 的错误</div>
                        {:else}
                            <div class="text-xs text-gray-400">请填写基础 URL 和 external_id 查看预览</div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- eBay -->
            <div class="rounded-lg bg-white shadow p-4 sm:p-6 space-y-4">
                <h2 class="text-base font-semibold text-gray-800">eBay</h2>
                <div>
                    <label for="ebayBaseUrl" class="block text-sm text-gray-700 mb-1">基础 URL</label>
                    <input
                        id="ebayBaseUrl"
                        type="url"
                        inputmode="url"
                        autocomplete="off"
                        spellcheck="false"
                        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 {ebayUrlError
                            ? 'border-red-400 focus:ring-red-300'
                            : 'border-gray-300 focus:ring-blue-300'}"
                        bind:value={ebayBaseUrl}
                        oninput={handleInput}
                        placeholder="https://www.ebay.com/itm/"
                        aria-invalid={ebayUrlError ? 'true' : 'false'}
                        aria-describedby="ebayHelp ebayError"
                    />
                    {#if ebayUrlError}
                        <p id="ebayError" class="mt-1 text-xs text-red-600">{ebayUrlError}</p>
                    {/if}
                    <p id="ebayHelp" class="mt-1 text-xs text-gray-500">
                        仅当链接平台为 eBay 且未填写完整 URL 时使用。留空表示禁用自动拼接。
                    </p>
                </div>
                <div>
                    <label for="ebayUrlSuffix" class="block text-sm text-gray-700 mb-1">URL 后缀</label>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-400">{'.../'}<code class="text-xs">{'{external_id}'}</code></span>
                        <input
                            id="ebayUrlSuffix"
                            type="text"
                            autocomplete="off"
                            spellcheck="false"
                            class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                            bind:value={ebayUrlSuffix}
                            oninput={handleInput}
                            placeholder="留空，通常不需要后缀"
                        />
                    </div>
                    <p class="mt-1 text-xs text-gray-500">
                        拼接在 external_id 后面的后缀，eBay 通常不需要。
                    </p>
                </div>
                <div class="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <div>
                        <label for="ebaySampleId" class="block text-xs font-medium text-gray-600 mb-1">预览 external_id</label>
                        <input
                            id="ebaySampleId"
                            type="text"
                            autocomplete="off"
                            spellcheck="false"
                            class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            bind:value={ebaySampleId}
                            placeholder="输入示例 external_id"
                        />
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 mb-1">预览结果</p>
                        {#if ebayPreviewUrl}
                            <a href={ebayPreviewUrl} target="_blank" rel="noopener noreferrer" class="text-xs break-all text-blue-600 hover:underline">
                                {ebayPreviewUrl} ↗
                            </a>
                        {:else if ebayUrlError}
                            <div class="text-xs text-gray-400">请先修正基础 URL 的错误</div>
                        {:else}
                            <div class="text-xs text-gray-400">请填写基础 URL 和 external_id 查看预览</div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-xs text-gray-500">
                    最近更新: {updatedAt ? new Date(updatedAt).toLocaleString('zh-CN') : '-'}
                    <span class="mx-1">|</span>
                    更新人: {updatedBy || '-'}
                    {#if isDirty}
                        <span class="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                            有未保存修改
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="px-3 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onclick={resetChanges}
                        disabled={!isDirty || saving}
                    >
                        撤销修改
                    </button>
                    <button
                        type="submit"
                        class="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={!canSave}
                        title={aliexpressUrlError ?? ebayUrlError ?? (isDirty ? '保存修改' : '没有需要保存的修改')}
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </form>
    {/if}
</div>