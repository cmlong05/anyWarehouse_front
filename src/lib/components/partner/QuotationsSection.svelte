<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import Loading from '$lib/components/Loading.svelte';

    interface Quotation {
        id: number;
        sku?: string;
        item_name?: string;
        price?: string;
        currency?: string;
    }
    
    interface Props {
        title: string;
        quotations: Quotation[];
        loading: boolean;
        emptyText: string;
        addHref: string;
        quotationQuantities: Record<number, number | null>;
        onQuantityChange: (id: number, value: number | null) => void;
        onRowClick: (id: number) => void;
        onCreateOrder: () => void;
    }
    
    let { title, quotations, loading, emptyText, addHref, quotationQuantities, onQuantityChange, onRowClick, onCreateOrder }: Props = $props();
</script>

<div class="quotations-section">
    <div class="section-header">
        <h2>{title}</h2>
        <div class="section-actions">
            <button class="btn btn-success btn-sm" onclick={onCreateOrder}>新建订单</button>
            <a href={addHref} class="btn btn-primary btn-sm">添加报价</a>
        </div>
    </div>
    
    {#if loading}
        <Loading text="加载报价..." />
    {:else if quotations.length === 0}
        <div class="empty-state">
            <p>{emptyText}</p>
            <a href={addHref} class="btn btn-primary">添加第一个报价</a>
        </div>
    {:else}
        <div class="quotations-table">
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>物品名称</th>
                        <th>单价</th>
                        <th>货币</th>
                        <th class="numeric">数量</th>
                    </tr>
                </thead>
                <tbody>
                    {#each quotations as quotation}
                        <tr>
                            <td class="clickable" onclick={() => onRowClick(quotation.id)}>{quotation.sku || '-'}</td>
                            <td class="clickable" onclick={() => onRowClick(quotation.id)}>{quotation.item_name || '-'}</td>
                            <td class="numeric clickable" onclick={() => onRowClick(quotation.id)}>{quotation.price}</td>
                            <td class="clickable" onclick={() => onRowClick(quotation.id)}>{quotation.currency}</td>
                            <td class="numeric">
                                <NumberStepper
                                    value={quotationQuantities[quotation.id] ?? undefined}
                                    step={1}
                                    size="sm"
                                    onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="section-footer">
            <button class="btn btn-success btn-sm" onclick={onCreateOrder}>新建订单</button>
        </div>
    {/if}
</div>

<style>
    .quotations-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
    }
    
    .section-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .section-footer {
        margin-top: 1.5rem;
        display: flex;
        justify-content: flex-end;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
    }
    
    .empty-state p {
        margin-bottom: 1rem;
    }
    
    .quotations-table {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        font-weight: 600;
        color: #374151;
        background-color: #f9fafb;
    }
    
    td {
        color: #4b5563;
    }
    
    .numeric {
        font-family: monospace;
        text-align: right;
    }
    
    .clickable {
        cursor: pointer;
    }
    
    .clickable:hover {
        background-color: #f3f4f6;
    }
    

    .btn {
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-success {
        background-color: #10b981;
        color: white;
    }
    
    .btn-success:hover {
        background-color: #059669;
    }
</style>
