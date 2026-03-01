<script lang="ts">
    import Alert from '$lib/components/Alert.svelte';

    interface Item {
        id: number;
        sku: string;
        item_name: string;
        quantity: string | number;
        quantity_shipped?: string | number;
        quantity_received?: string | number;
        quantity_pending?: string | number;
    }

    interface Props {
        show: boolean;
        title: string;
        items: Item[];
        quantities: Record<number, number>;
        notes: string;
        updating: boolean;
        error: string | null;
        type: 'ship' | 'receive';
        onClose: () => void;
        onConfirm: () => void;
        onNotesChange: (value: string) => void;
    }
    
    let {
        show,
        title,
        items,
        quantities,
        notes,
        updating,
        error,
        type,
        onClose,
        onConfirm,
        onNotesChange,
    }: Props = $props();

    function getProcessedQty(item: Item): number {
        return Number(type === 'ship' ? (item.quantity_shipped || 0) : (item.quantity_received || 0));
    }

    function getPendingQty(item: Item): number {
        return Number(item.quantity_pending || 0);
    }

    function getTotalQuantity(): number {
        return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal-overlay" onclick={(e) => e.target === e.currentTarget && onClose()} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation" tabindex="-1">
        <div class="modal">
            <div class="modal-header">
                <h2>{title}</h2>
                <button class="close-btn" onclick={onClose}>×</button>
            </div>
            <div class="modal-body">
                {#if error}
                    <Alert error={{message: error}} onDismiss={() => {}} />
                {/if}
                
                <div class="ship-form">
                    <table class="ship-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>物品名称</th>
                                <th class="numeric">订购数量</th>
                                <th class="numeric">{type === 'ship' ? '已发货' : '已收货'}</th>
                                <th class="numeric">本次{type === 'ship' ? '发货' : '收货'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each items.filter(i => getPendingQty(i) > 0) as item}
                                <tr>
                                    <td class="mono">{item.sku}</td>
                                    <td>{item.item_name}</td>
                                    <td class="numeric">{item.quantity}</td>
                                    <td class="numeric">{getProcessedQty(item)}</td>
                                    <td class="numeric">
                                        <input
                                            type="number"
                                            min="0"
                                            max={getPendingQty(item)}
                                            step="1"
                                            bind:value={quantities[item.id]}
                                            class="qty-input"
                                        />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>

                    <div class="ship-summary">
                        <span>本次{type === 'ship' ? '发货' : '收货'}总量: <strong>{getTotalQuantity()}</strong></span>
                    </div>

                    <div class="form-group">
                        <label for="ship-notes">{type === 'ship' ? '发货' : '收货'}备注</label>
                        <textarea
                            id="ship-notes"
                            value={notes}
                            oninput={(e) => onNotesChange(e.currentTarget.value)}
                            placeholder="输入备注（可选）"
                            rows="2"
                        ></textarea>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick={onClose} disabled={updating}>取消</button>
                        <button class="btn btn-primary" onclick={onConfirm} disabled={updating || getTotalQuantity() === 0}>
                            {updating ? '处理中...' : `确认${type === 'ship' ? '发货' : '收货'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }

    .modal {
        background: white;
        border-radius: 8px;
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0.25rem;
        line-height: 1;
    }

    .close-btn:hover {
        color: #333;
    }

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        max-height: calc(90vh - 70px);
    }

    .ship-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .ship-table th,
    .ship-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .ship-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .ship-table .numeric {
        text-align: right;
    }

    .ship-table .mono {
        font-family: monospace;
    }

    .qty-input {
        width: 80px;
        padding: 0.375rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        text-align: right;
    }

    .ship-summary {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #e7f3ff;
        border-radius: 4px;
        text-align: right;
    }

    .form-group {
        margin-top: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.375rem;
    }

    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        resize: vertical;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }
</style>
