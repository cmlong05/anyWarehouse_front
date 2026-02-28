<script lang="ts">
    interface Props {
        address: string;
        contactPerson: string;
        contactPhone: string;
    }
    
    let { 
        address = $bindable(), 
        contactPerson = $bindable(), 
        contactPhone = $bindable() 
    }: Props = $props();
</script>

<div class="bg-gray-50 rounded-lg p-4">
    <span class="label label-text font-bold mb-2 block">📤 收货信息</span>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="form-control">
            <label class="label" for="shippingAddress">
                <span class="label-text text-xs">收货地址</span>
            </label>
            <input 
                id="shippingAddress"
                type="text" 
                class="input input-bordered input-sm" 
                bind:value={address}
                placeholder="输入收货地址"
            />
        </div>
        <div class="form-control">
            <label class="label" for="contactPerson">
                <span class="label-text text-xs">联系人</span>
            </label>
            <input 
                id="contactPerson"
                type="text" 
                class="input input-bordered input-sm" 
                bind:value={contactPerson}
                placeholder="输入联系人"
            />
        </div>
        <div class="form-control">
            <label class="label" for="contactPhone">
                <span class="label-text text-xs">联系电话</span>
            </label>
            <input 
                id="contactPhone"
                type="text" 
                class="input input-bordered input-sm" 
                bind:value={contactPhone}
                placeholder="输入联系电话"
            />
        </div>
    </div>
</div>

<style>
    .bg-gray-50 { background-color: #f9fafb; }
    .rounded-lg { border-radius: 0.5rem; }
    .p-4 { padding: 1rem; }
    .label-text { font-size: 0.875rem; color: #374151; }
    .font-bold { font-weight: 600; }
    .mb-2 { margin-bottom: 0.5rem; }
    .block { display: block; }
    .grid { display: grid; gap: 1rem; }
    .form-control { margin-bottom: 0; }
    .label { display: block; margin-bottom: 0.25rem; }
    .input {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }
    .input:focus { outline: none; border-color: #3b82f6; }
    @media (min-width: 768px) {
        .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    }
</style>
