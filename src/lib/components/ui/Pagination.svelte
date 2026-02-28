<script lang="ts">
    /**
     * 通用分页组件
     */
    interface Props {
        page: number;
        pageSize?: number;
        totalCount: number;
        totalPages: number;
        disabled?: boolean;
        showInfo?: boolean;
        onPageChange: (page: number) => void;
    }
    
    let {
        page,
        pageSize = 20,
        totalCount,
        totalPages,
        disabled = false,
        showInfo = true,
        onPageChange
    }: Props = $props();
    
    function goToPage(p: number) {
        if (p < 1 || p > totalPages || p === page || disabled) return;
        onPageChange(p);
    }
    
    function getPageNumbers(): number[] {
        const pages: number[] = [];
        const delta = 2;
        
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= page - delta && i <= page + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== -1) {
                pages.push(-1); // -1 表示省略号
            }
        }
        
        return pages;
    }
</script>

{#if totalPages > 1}
    <div class="pagination">
        <button
            class="btn btn-prev"
            onclick={() => goToPage(page - 1)}
            disabled={page === 1 || disabled}
            aria-label="上一页"
        >
            ←
        </button>
        
        {#each getPageNumbers() as p}
            {#if p === -1}
                <span class="ellipsis">...</span>
            {:else}
                <button
                    class="btn btn-page"
                    class:active={p === page}
                    onclick={() => goToPage(p)}
                    disabled={disabled}
                    aria-label="第 {p} 页"
                    aria-current={p === page ? 'page' : undefined}
                >
                    {p}
                </button>
            {/if}
        {/each}
        
        <button
            class="btn btn-next"
            onclick={() => goToPage(page + 1)}
            disabled={page === totalPages || disabled}
            aria-label="下一页"
        >
            →
        </button>
        
        {#if showInfo}
            <span class="page-info">
                共 {totalCount} 条
            </span>
        {/if}
    </div>
{/if}

<style>
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        padding: 1rem;
        flex-wrap: wrap;
    }
    
    .btn {
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.5rem;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
    }
    
    .btn.active:hover {
        background: #2563eb;
    }
    
    .btn-prev,
    .btn-next {
        font-weight: bold;
    }
    
    .ellipsis {
        color: #9ca3af;
        padding: 0 0.5rem;
        user-select: none;
    }
    
    .page-info {
        margin-left: 1rem;
        color: #6b7280;
        font-size: 0.875rem;
        white-space: nowrap;
    }
    
    @media (max-width: 640px) {
        .pagination {
            gap: 0.125rem;
        }
        
        .btn {
            min-width: 1.75rem;
            height: 1.75rem;
            font-size: 0.8rem;
        }
        
        .page-info {
            margin-left: 0.5rem;
            font-size: 0.8rem;
        }
    }
</style>
