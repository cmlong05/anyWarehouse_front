/**
 * 发货单详情页共享逻辑
 */
import { goto } from '$app/navigation';
import { shipmentAPI, packageAPI } from '$lib/api';
import type { Shipment, Package } from '$lib/shipmentTypes';
import { t, getStatusText, type Locale } from '$lib/i18n/shipment';

export interface ShipmentActionConfig {
    action: string;
    label: string;
    variant: 'primary' | 'outline' | 'error';
    confirmMessage: string;
}

// 发货单状态流转配置 - 基于当前语言
export function getShipmentActions(locale: Locale = 'zh'): Record<string, ShipmentActionConfig[]> {
    return {
        draft: [
            { action: 'confirm', label: t('shipment.btn.confirm', locale), variant: 'primary', confirmMessage: t('shipment.msg.confirmConfirm', locale) || 'Confirm this shipment?' },
            { action: 'sync', label: t('shipment.btn.sync', locale), variant: 'outline', confirmMessage: t('shipment.msg.confirmSync', locale) || 'Sync items to packages?' },
        ],
        confirmed: [
            { action: 'pack', label: t('shipment.btn.pack', locale), variant: 'primary', confirmMessage: t('shipment.msg.confirmPack', locale) || 'Confirm packing complete?' },
            { action: 'ship', label: t('shipment.btn.ship', locale), variant: 'outline', confirmMessage: t('shipment.msg.confirmShip', locale) || 'Confirm shipment?' },
        ],
        packed: [
            { action: 'ship', label: t('shipment.btn.ship', locale), variant: 'primary', confirmMessage: t('shipment.msg.confirmShip', locale) || 'Confirm shipment?' },
        ],
        shipped: [
            { action: 'deliver', label: t('shipment.btn.deliver', locale), variant: 'primary', confirmMessage: t('shipment.msg.confirmDeliver', locale) || 'Confirm delivery?' },
        ],
    };
}

// 保持兼容性 - 默认中文
export const SHIPMENT_ACTIONS = getShipmentActions('zh');

export function useShipmentDetail(shipmentId: () => number) {
    let shipment = $state<Shipment | null>(null);
    let loading = $state(true);
    let error = $state('');
    let actionLoading = $state(false);

    // 弹窗状态
    let showDeleteModal = $state(false);
    let showNewPackageModal = $state(false);
    let showLinkPackageModal = $state(false);

    // 删除状态
    let deleting = $state(false);

    // 包裹管理状态
    let availablePackages = $state<Package[]>([]);
    let linkingPackage = $state(false);
    let selectedPackageId = $state<number | null>(null);

    async function loadShipment(id?: number) {
        const targetId = id || shipmentId();
        if (!targetId || isNaN(targetId)) return;
        
        try {
            loading = true;
            error = '';
            shipment = await shipmentAPI.get(targetId);
        } catch (err: any) {
            error = err.message || '加载发货批次失败';
        } finally {
            loading = false;
        }
    }

    function goBack() {
        goto('/customer/shipment');
    }

    function goToEdit() {
        goto(`/customer/shipment/${shipmentId()}/edit`);
    }

    async function executeAction(action: string): Promise<boolean> {
        if (!shipment) return false;
        
        actionLoading = true;
        error = '';
        
        try {
            switch (action) {
                case 'confirm':
                    await shipmentAPI.confirm(shipment.id);
                    break;
                case 'pack':
                    await shipmentAPI.pack(shipment.id);
                    break;
                case 'ship':
                    await shipmentAPI.ship(shipment.id);
                    break;
                case 'deliver':
                    await shipmentAPI.deliver(shipment.id);
                    break;
                case 'cancel':
                    await shipmentAPI.cancel(shipment.id);
                    break;
                case 'sync':
                    await shipmentAPI.syncItems(shipment.id);
                    break;
            }
            await loadShipment();
            return true;
        } catch (err: any) {
            error = err.message || '操作失败';
            return false;
        } finally {
            actionLoading = false;
        }
    }

    async function deleteShipment(): Promise<boolean> {
        if (!shipment) return false;
        
        try {
            deleting = true;
            await shipmentAPI.delete(shipment.id);
            goto('/customer/shipment');
            return true;
        } catch (err: any) {
            error = err.message || '删除失败';
            deleting = false;
            return false;
        }
    }

    function goToPackageDetail(packageId: number) {
        goto(`/customer/package/${packageId}`);
    }

    // 加载可用的包裹
    async function loadAvailablePackages() {
        try {
            const response = await packageAPI.getList({ page_size: 100 });
            const linkedIds = new Set(shipment?.packages?.map(p => p.id) || []);
            availablePackages = response.results.filter(p => !linkedIds.has(p.id));
        } catch (err: any) {
            error = err.message || '加载可用包裹失败';
        }
    }

    // 关联已有包裹
    async function linkPackage(): Promise<boolean> {
        if (!selectedPackageId || !shipment) return false;
        
        linkingPackage = true;
        error = '';
        
        try {
            await packageAPI.addToShipment(selectedPackageId, shipment.id);
            await loadShipment();
            showLinkPackageModal = false;
            selectedPackageId = null;
            return true;
        } catch (err: any) {
            error = err.message || '关联包裹失败';
            return false;
        } finally {
            linkingPackage = false;
        }
    }

    // 打开关联包裹弹窗
    function openLinkPackageModal() {
        showLinkPackageModal = true;
        loadAvailablePackages();
    }
    
    // 打开新建包裹弹窗
    function openNewPackageModal() {
        showNewPackageModal = true;
    }

    return {
        // 状态
        get shipment() { return shipment; },
        get loading() { return loading; },
        get error() { return error; },
        get actionLoading() { return actionLoading; },
        get showDeleteModal() { return showDeleteModal; },
        set showDeleteModal(value) { showDeleteModal = value; },
        get showNewPackageModal() { return showNewPackageModal; },
        set showNewPackageModal(value) { showNewPackageModal = value; },
        get showLinkPackageModal() { return showLinkPackageModal; },
        set showLinkPackageModal(value) { showLinkPackageModal = value; },
        get deleting() { return deleting; },
        get availablePackages() { return availablePackages; },
        get linkingPackage() { return linkingPackage; },
        get selectedPackageId() { return selectedPackageId; },
        set selectedPackageId(value) { selectedPackageId = value; },
        
        // 方法
        loadShipment,
        goBack,
        goToEdit,
        executeAction,
        deleteShipment,
        goToPackageDetail,
        linkPackage,
        openNewPackageModal,
        openLinkPackageModal,
    };
}
