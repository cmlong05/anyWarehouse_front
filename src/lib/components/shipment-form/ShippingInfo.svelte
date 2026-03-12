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
    <span class="text-sm text-gray-700 font-bold mb-2 block">📤 收货信息</span>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="mb-0">
            <label class="block mb-1" for="shippingAddress">
                <span class="text-xs text-gray-700">收货地址</span>
            </label>
            <input 
                id="shippingAddress"
                type="text" 
                class="w-full py-1.5 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" 
                bind:value={address}
                placeholder="输入收货地址"
            />
        </div>
        <div class="mb-0">
            <label class="block mb-1" for="contactPerson">
                <span class="text-xs text-gray-700">联系人</span>
            </label>
            <input 
                id="contactPerson"
                type="text" 
                class="w-full py-1.5 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" 
                bind:value={contactPerson}
                placeholder="输入联系人"
            />
        </div>
        <div class="mb-0">
            <label class="block mb-1" for="contactPhone">
                <span class="text-xs text-gray-700">联系电话</span>
            </label>
            <input 
                id="contactPhone"
                type="text" 
                class="w-full py-1.5 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" 
                bind:value={contactPhone}
                placeholder="输入联系电话"
            />
        </div>
    </div>
</div>
