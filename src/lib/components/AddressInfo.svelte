<!-- 地址信息 -->
<!--
被依赖：
- `lib/components/OrderForm.svelte`
- `lib/components/shipment-form/ShippingInfo.svelte`
- `routes/customer/shipment/[id]/+page.svelte`
-->
<script lang="ts">
    interface Props {
        title?: string;
        contactPerson?: string;
        contactPhone?: string;
        companyName?: string;
        email?: string;
        mobile?: string;
        taxNumber?: string;
        country?: string;
        province?: string;
        city?: string;
        district?: string;
        shippingAddress?: string;
        detailAddress2?: string;
        postalCode?: string;
        paymentTerms?: string;
        remark?: string;
        className?: string;
    }

    let {
        title = undefined,
        contactPerson = undefined,
        contactPhone = undefined,
        companyName = undefined,
        email = undefined,
        mobile = undefined,
        taxNumber = undefined,
        country = undefined,
        province = undefined,
        city = undefined,
        district = undefined,
        shippingAddress = undefined,
        detailAddress2 = undefined,
        postalCode = undefined,
        paymentTerms = undefined,
        remark = undefined,
        className = ''
    }: Props = $props();
</script>

<div class="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-4 text-sm text-gray-700 {className}">
    {#if title}
        <div class="text-xs text-gray-400 mb-3">{title}</div>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {#if contactPerson}
            <div><span class="text-gray-500">收件人：</span><span class="text-gray-900">{contactPerson}</span></div>
        {/if}
        {#if companyName}
            <div><span class="text-gray-500">公司名称：</span><span class="text-gray-900">{companyName}</span></div>
        {/if}
        {#if contactPhone}
            <div><span class="text-gray-500">电话：</span><span class="text-gray-900">{contactPhone}</span></div>
        {/if}
        {#if mobile}
            <div><span class="text-gray-500">手机：</span><span class="text-gray-900">{mobile}</span></div>
        {/if}
        {#if email}
            <div><span class="text-gray-500">邮箱：</span><span class="text-gray-900">{email}</span></div>
        {/if}
        {#if taxNumber}
            <div><span class="text-gray-500">税号：</span><span class="text-gray-900">{taxNumber}</span></div>
        {/if}
        {#if country}
            <div><span class="text-gray-500">国家：</span><span class="text-gray-900">{country}</span></div>
        {/if}
        {#if province}
            <div><span class="text-gray-500">省/州：</span><span class="text-gray-900">{province}</span></div>
        {/if}
        {#if city}
            <div><span class="text-gray-500">城市：</span><span class="text-gray-900">{city}</span></div>
        {/if}
        {#if district}
            <div><span class="text-gray-500">区/县：</span><span class="text-gray-900">{district}</span></div>
        {/if}
        {#if postalCode}
            <div><span class="text-gray-500">邮编：</span><span class="text-gray-900">{postalCode}</span></div>
        {/if}
        {#if paymentTerms}
            <div class="md:col-span-2"><span class="text-gray-500">付款条款：</span><span class="text-gray-900">{paymentTerms}</span></div>
        {/if}
        {#if shippingAddress}
            <div class="md:col-span-2"><span class="text-gray-500">地址：</span><span class="text-gray-900 whitespace-pre-wrap">{shippingAddress}</span></div>
        {/if}
        {#if detailAddress2}
            <div class="md:col-span-2"><span class="text-gray-500">地址补充：</span><span class="text-gray-900 whitespace-pre-wrap">{detailAddress2}</span></div>
        {/if}
        {#if remark}
            <div class="md:col-span-2"><span class="text-gray-500">备注：</span><span class="text-gray-900 whitespace-pre-wrap">{remark}</span></div>
        {/if}
    </div>
</div>