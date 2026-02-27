<script lang="ts">
    import { goto } from '$app/navigation';

    interface Category {
        id: number | string;
        name: string;
    }

    interface $$Props {
        isOpen?: boolean;
        itemName?: string;
        itemCategories?: Category[];
    }

    export let isOpen: boolean = false;
    export let itemName: string = '';
    export let itemCategories: Category[] = [];

    // 添加调试信息
    $: console.log('DeleteNavigationModal 状态:', { isOpen, itemName, itemCategories });

    function closeModal() {
        console.log('关闭弹框');
        isOpen = false;
    }

    function navigateTo(path: string) {
        console.log('导航到:', path);
        closeModal();
        goto(path);
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }} role="presentation" tabindex="-1">
        <div class="modal-content">
            <div class="modal-header">
                <h3>删除成功</h3>
                <button class="close-btn" onclick={closeModal}>×</button>
            </div>
            
            <div class="modal-body">
                <p>商品 "<strong>{itemName}</strong>" 已成功删除。</p>
                <p>请选择要跳转的页面：</p>
                
                <div class="navigation-options">
                    <!-- 品项所在的分类 -->
                    {#if itemCategories.length > 0}
                        <div class="category-section">
                            <h4>品项所在分类：</h4>
                            {#each itemCategories as category}
                                <button class="nav-option category-option" onclick={() => navigateTo(`/category/${category.id}`)}>
                                    <span class="option-icon">📁</span>
                                    <span class="option-text">{category.name}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                    <h4>其他：</h4>
                    <!-- 主页 -->
                    <button class="nav-option" onclick={() => navigateTo('/')}>
                        <span class="option-icon">🏠</span>
                        <span class="option-text">主页</span>
                    </button>

                    <!-- 所有品项页面 -->
                    <button class="nav-option" onclick={() => navigateTo('/item')}>
                        <span class="option-icon">📦</span>
                        <span class="option-text">所有品项</span>
                    </button>

                    <!-- 所有分类页面 -->
                    <button class="nav-option" onclick={() => navigateTo('/category')}>
                        <span class="option-icon">🗂️</span>
                        <span class="option-text">所有分类</span>
                    </button>

                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.25rem;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.15s ease;
    }

    .close-btn:hover {
        background-color: #f5f5f5;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-body p {
        margin: 0 0 1rem 0;
        color: #333;
        line-height: 1.5;
    }

    .navigation-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .nav-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        width: 100%;
    }

    .nav-option:hover {
        background-color: #f8f9fa;
        border-color: #007bff;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .option-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .option-text {
        font-size: 1rem;
        color: #333;
        font-weight: 500;
    }

    .category-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }

    .category-section h4 {
        margin: 0 0 0.75rem 0;
        color: #555;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .category-option {
        background-color: #f8f9fa;
        border-color: #e9ecef;
    }

    .category-option:hover {
        background-color: #e9ecef;
        border-color: #6c757d;
    }

    @media (max-width: 480px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }

        .modal-header,
        .modal-body {
            padding: 1rem;
        }

        .nav-option {
            padding: 0.6rem 0.8rem;
        }

        .option-text {
            font-size: 0.9rem;
        }
    }
</style>
