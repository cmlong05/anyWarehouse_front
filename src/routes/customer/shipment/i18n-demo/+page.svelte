<script lang="ts">
    /**
     * 发货单国际化演示页面
     * 展示如何使用 i18n 系统
     */
    import { localeStore, t, getStatusText, setLocale, type Locale } from '$lib/i18n/shipment';
    import { LocaleSwitcher } from '$lib/components/shipment';
    
    // 示例状态列表
    const statuses = ['draft', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'synced'];
    
    // 快速切换语言
    function quickSwitch(locale: Locale) {
        setLocale(locale);
        localeStore.set(locale);
    }
</script>

<svelte:head>
    <title>{$localeStore === 'zh' ? '发货单国际化演示' : 'Shipment i18n Demo'} - AnyWarehouse</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">
                {t('shipment.detail.title', $localeStore)}
            </h1>
            <p class="text-gray-500 mt-1">
                {$localeStore === 'zh' 
                    ? '演示发货单国际化功能，支持中英文切换' 
                    : 'Demonstration of shipment internationalization with Chinese/English support'}
            </p>
        </div>
        
        <!-- 语言切换器 -->
        <LocaleSwitcher variant="tabs" />
    </div>
    
    <!-- 状态展示 -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {t('shipment.field.status', $localeStore)}
        </h2>
        <div class="flex flex-wrap gap-2">
            {#each statuses as status}
                <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    <span class="text-gray-400 mr-2">{status}:</span>
                    {getStatusText(status, $localeStore)}
                </span>
            {/each}
        </div>
    </div>
    
    <!-- 按钮展示 -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {$localeStore === 'zh' ? '操作按钮' : 'Action Buttons'}
        </h2>
        <div class="flex flex-wrap gap-2">
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                {t('shipment.btn.confirm', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                {t('shipment.btn.pack', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {t('shipment.btn.ship', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                {t('shipment.btn.deliver', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                {t('shipment.btn.cancel', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
                {t('shipment.btn.edit', $localeStore)}
            </button>
            <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                {t('shipment.btn.back', $localeStore)}
            </button>
        </div>
    </div>
    
    <!-- 表单字段展示 -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {t('shipment.package.title', $localeStore)}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.field.shipmentNumber', $localeStore)}</span>
                <p class="font-mono text-gray-900">SH20240311001</p>
            </div>
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.field.trackingNumber', $localeStore)}</span>
                <p class="font-mono text-gray-900">1Z999AA10123456784</p>
            </div>
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.field.carrier', $localeStore)}</span>
                <p class="text-gray-900">UPS</p>
            </div>
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.package.weight', $localeStore)}</span>
                <p class="text-gray-900">2.5 kg</p>
            </div>
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.field.dimensions', $localeStore)}</span>
                <p class="text-gray-900">30×20×15 cm</p>
            </div>
            <div>
                <span class="text-gray-500 text-sm">{t('shipment.field.shipDate', $localeStore)}</span>
                <p class="text-gray-900">2024-03-11</p>
            </div>
        </div>
    </div>
    
    <!-- 提示信息展示 -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {$localeStore === 'zh' ? '提示消息' : 'Messages'}
        </h2>
        <div class="space-y-2 text-sm">
            <p class="p-3 bg-green-50 text-green-700 rounded">
                ✓ {t('shipment.msg.createSuccess', $localeStore)}
            </p>
            <p class="p-3 bg-blue-50 text-blue-700 rounded">
                ℹ {t('shipment.msg.updateSuccess', $localeStore)}
            </p>
            <p class="p-3 bg-red-50 text-red-700 rounded">
                ✗ {t('shipment.error.loadFailed', $localeStore)}
            </p>
        </div>
    </div>
    
    <!-- 确认消息展示 -->
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {$localeStore === 'zh' ? '确认对话框' : 'Confirm Dialogs'}
        </h2>
        <div class="space-y-2 text-sm">
            <p class="p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                ⚠️ {t('shipment.msg.confirmDelete', $localeStore)}
            </p>
            <p class="p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                ⚠️ {t('shipment.msg.confirmShip', $localeStore)}
            </p>
        </div>
    </div>
    
    <!-- 使用说明 -->
    <div class="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 class="font-semibold text-gray-900 mb-2">
            {$localeStore === 'zh' ? '如何在代码中使用' : 'How to use in code'}
        </h3>
        <pre class="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">import {'{'} t, getStatusText, localeStore {'}'} from '$lib/i18n/shipment';
import {'{'} LocaleSwitcher {'}'} from '$lib/components/shipment';

// 在模板中使用
&lt;LocaleSwitcher variant="tabs" /&gt;

&lt;!-- 静态文本 --&gt;
&lt;h1&gt;{'{'}t('shipment.detail.title', $localeStore){'}'}&lt;/h1&gt;

&lt;!-- 动态状态 --&gt;
&lt;span&gt;{'{'}getStatusText('shipped', $localeStore){'}'}&lt;/span&gt;</pre>
    </div>
</div>
