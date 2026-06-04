<script lang="ts">
    import { untrack } from 'svelte';
    import { logger } from '$lib/logger';
    import type { ItemExternalLink } from '$lib';
    import { externalLinkAPI } from '$lib/api';
    import { hasChangedFields, shouldDismissModal } from '$lib/utils';
    import Plus from 'lucide-svelte/icons/plus';

    const PLATFORM_OPTIONS = [
        { value: 'aliexpress', label: 'AliExpress' },
        { value: 'ebay', label: 'eBay' },
        { value: 'amazon', label: 'Amazon' },
        { value: 'taobao', label: 'Taobao' },
        { value: 'tmall', label: 'Tmall' },
        { value: 'jd', label: 'JD' },
        { value: 'other', label: 'Other' },
    ];
    const LINK_TYPE_OPTIONS = [
        { value: 'own', label: '自家店铺' },
        { value: 'reference', label: '参考链接' },
        { value: 'competitor', label: '竞品' },
    ];
    const LINK_TYPE_COLORS: Record<string, string> = {
        own: 'border-orange-300 bg-orange-50 text-orange-700',
        reference: 'border-gray-200 bg-gray-50 text-gray-700',
        competitor: 'border-rose-200 bg-rose-50 text-rose-700',
    };

    let {
        itemId,
        aliexpressBaseUrl = '',
        ebayBaseUrl = '',
        initialLinks = [],
        count = $bindable(0),
    }: {
        itemId: number;
        aliexpressBaseUrl?: string;
        ebayBaseUrl?: string;
        initialLinks?: ItemExternalLink[];
        count?: number;
    } = $props();

    let externalLinks = $state<ItemExternalLink[]>(untrack(() => initialLinks));
    let newLink = $state({ platform: 'aliexpress', link_type: 'own', external_id: '', url: '', label: '' });
    let addingLink = $state(false);
    let showAddForm = $state(false);
    let initialNewLink = $state({ platform: 'aliexpress', link_type: 'own', external_id: '', url: '', label: '' });
    const formFields = ['platform', 'link_type', 'external_id', 'url', 'label'] as const;

    const isAddFormDirty = $derived(
        hasChangedFields(newLink, initialNewLink, formFields)
    );

    function resetNewLink() {
        newLink = { platform: 'aliexpress', link_type: 'own', external_id: '', url: '', label: '' };
        initialNewLink = { ...newLink };
    }

    function openAddForm() {
        resetNewLink();
        showAddForm = true;
    }

    function closeAddForm() {
        showAddForm = false;
        resetNewLink();
    }

    function handleBackdropClick(event: MouseEvent) {
        if (shouldDismissModal(event, !isAddFormDirty)) {
            closeAddForm();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (shouldDismissModal(event, !isAddFormDirty)) {
            event.preventDefault();
            closeAddForm();
        }
    }

    $effect(() => {
        count = externalLinks.length;
    });

    function getPlatformLinkUrl(link: ItemExternalLink): string {
        if (link.url) return link.url;
        if (link.platform === 'aliexpress' && link.external_id) {
            const base = aliexpressBaseUrl.trim();
            if (!base) return '#';
            const normalizedBase = base.endsWith('/') ? base : `${base}/`;
            return `${normalizedBase}${link.external_id}`;
        }
        if (link.platform === 'ebay' && link.external_id) {
            const base = ebayBaseUrl.trim();
            if (!base) return '#';
            const normalizedBase = base.endsWith('/') ? base : `${base}/`;
            return `${normalizedBase}${link.external_id}`;
        }
        return '#';
    }

    async function handleAddLink() {
        if (!newLink.external_id && !newLink.url) return;
        addingLink = true;
        try {
            const created = await externalLinkAPI.create({
                item: itemId,
                platform: newLink.platform,
                link_type: newLink.link_type,
                external_id: newLink.external_id.trim(),
                url: newLink.url.trim(),
                label: newLink.label.trim(),
                sort_order: externalLinks.length,
            });
            externalLinks = [...externalLinks, created];
            closeAddForm();
        } catch (e) {
            logger.error('添加外部链接失败:', e);
            alert('添加失败，请检查填写内容');
        } finally {
            addingLink = false;
        }
    }

    async function handleDeleteLink(id: number) {
        try {
            await externalLinkAPI.delete(id);
            externalLinks = externalLinks.filter((l) => l.id !== id);
        } catch (e) {
            logger.error('删除外部链接失败:', e);
            alert('删除失败，请稍后重试');
        }
    }
</script>

<div class="space-y-5">
    <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">外部平台链接</h2>
        <button
            type="button"
            onclick={openAddForm}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
            <Plus class="h-4 w-4" />
            添加链接
        </button>
    </div>

    {#if externalLinks.length > 0}
        <div class="space-y-2">
            {#each externalLinks as link (link.id)}
                {@const linkUrl = getPlatformLinkUrl(link)}
                {@const colorClass = LINK_TYPE_COLORS[link.link_type] ?? 'border-gray-200 bg-gray-50 text-gray-700'}
                <div class="flex items-center gap-2 rounded-lg border px-3 py-2 {colorClass}">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-medium uppercase tracking-wide opacity-60">{link.platform}</span>
                            <span class="text-xs opacity-50">·</span>
                            <span class="text-xs opacity-60">{LINK_TYPE_OPTIONS.find(o => o.value === link.link_type)?.label ?? link.link_type}</span>
                            {#if link.label}
                                <span class="text-xs opacity-80">{link.label}</span>
                            {/if}
                        </div>
                        <div class="mt-0.5 text-sm font-medium truncate">
                            {#if linkUrl !== '#'}
                                <a href={linkUrl} target="_blank" rel="noopener noreferrer" class="hover:underline">
                                    {link.external_id || link.url} ↗
                                </a>
                            {:else}
                                <span>{link.external_id || link.url}</span>
                            {/if}
                        </div>
                    </div>
                    <button
                        type="button"
                        onclick={() => handleDeleteLink(link.id)}
                        class="shrink-0 p-1 text-current opacity-40 hover:opacity-80 transition-opacity"
                        aria-label="删除"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {:else}
        <div class="text-center py-8 bg-gray-50 rounded-lg text-gray-400 text-sm">
            暂无外部链接，点击右上角"添加链接"
        </div>
    {/if}
</div>

{#if showAddForm}
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-link-dialog-title"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        tabindex="-1"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
    >
        <div
            class="absolute inset-0 bg-black/40"
            onclick={handleBackdropClick}
            aria-hidden="true"
        ></div>

        <div class="relative w-full max-w-md bg-white rounded-xl shadow-xl">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 id="add-link-dialog-title" class="text-base font-semibold text-gray-900">添加外部链接</h3>
                <button
                    type="button"
                    onclick={closeAddForm}
                    class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="关闭"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="px-5 py-4 space-y-4">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="new-link-type" class="block text-xs font-medium text-gray-600 mb-1">类型</label>
                        <select
                            id="new-link-type"
                            bind:value={newLink.link_type}
                            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                        >
                            {#each LINK_TYPE_OPTIONS as opt}
                                <option value={opt.value}>{opt.label}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="new-link-platform" class="block text-xs font-medium text-gray-600 mb-1">平台</label>
                        <select
                            id="new-link-platform"
                            bind:value={newLink.platform}
                            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                        >
                            {#each PLATFORM_OPTIONS as opt}
                                <option value={opt.value}>{opt.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <div>
                    <label for="new-link-eid" class="block text-xs font-medium text-gray-600 mb-1">外部 ID（例如 AliExpress 商品号）</label>
                    <input
                        id="new-link-eid"
                        type="text"
                        bind:value={newLink.external_id}
                        placeholder="如 1005001234567890"
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                    />
                </div>
                <div>
                    <label for="new-link-url" class="block text-xs font-medium text-gray-600 mb-1">完整 URL（可选，无需填 ID 时直接填链接）</label>
                    <input
                        id="new-link-url"
                        type="url"
                        bind:value={newLink.url}
                        placeholder="https://..."
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                    />
                </div>
                <div>
                    <label for="new-link-label" class="block text-xs font-medium text-gray-600 mb-1">备注（选填）</label>
                    <input
                        id="new-link-label"
                        type="text"
                        bind:value={newLink.label}
                        placeholder="店铺名、竞品品牌等"
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                    />
                </div>
            </div>

            <div class="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                    type="button"
                    onclick={closeAddForm}
                    class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >取消</button>
                <button
                    type="button"
                    onclick={handleAddLink}
                    disabled={addingLink || (!newLink.external_id && !newLink.url)}
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >{addingLink ? '保存中...' : '保存'}</button>
            </div>
        </div>
    </div>
{/if}
