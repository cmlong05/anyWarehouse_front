<!-- 物流信息 -->
<script lang="ts">
    import AddressInfo from '$lib/components/AddressInfo.svelte';

    interface Props {
        address?: string;
        contactPerson?: string;
        contactPhone?: string;
        companyName?: string;
        paymentTerms?: string;
        email?: string;
        mobile?: string;
        taxNumber?: string;
        country?: string;
        province?: string;
        city?: string;
        district?: string;
        postalCode?: string;
        detailAddress2?: string;
        remark?: string;
    }
    
    let { 
        address = $bindable(), 
        contactPerson = $bindable(), 
        contactPhone = $bindable(),
        companyName = $bindable(),
        paymentTerms = $bindable(),
        email = $bindable(),
        mobile = $bindable(),
        taxNumber = $bindable(),
        country = $bindable(),
        province = $bindable(),
        city = $bindable(),
        district = $bindable(),
        postalCode = $bindable(),
        detailAddress2 = $bindable(),
        remark = $bindable(),
    }: Props = $props();
</script>

<AddressInfo
    title="📤 收货信息"
    shippingAddress={address}
    contactPerson={contactPerson}
    contactPhone={contactPhone}
    companyName={companyName}
    paymentTerms={paymentTerms}
    email={email}
    mobile={mobile}
    taxNumber={taxNumber}
    country={country}
    province={province}
    city={city}
    district={district}
    postalCode={postalCode}
    detailAddress2={detailAddress2}
    remark={remark}
/>
