/**
 * 发货单详情页共享逻辑
 */
import { goto } from '$app/navigation';
import { shipmentAPI, packageAPI } from '$lib/api';
import type { Shipment, Package } from '$lib/shipmentTypes';
import { getErrorMessage } from '$lib/utils/errors';

export interface ShipmentActionConfig {
    action: string;
    label: string;
    variant: 'primary' | 'outline' | 'error';
    confirmMessage: string;
}

// 发货单状态流转配置 - 基于当前语言
export function getShipmentActions(): Record<string, ShipmentActionConfig[]> {
    return {
        draft: [
            { action: 'confirm', label: '确认', variant: 'primary', confirmMessage: '确认要确认此发货单吗？确认后不可修改明细。' },
            { action: 'sync', label: '同步包裹数量', variant: 'outline', confirmMessage: '确认要根据包裹实际装箱情况同步发货明细吗？' },
        ],
        synced: [
            { action: 'confirm', label: '确认', variant: 'primary', confirmMessage: '确认要确认此发货单吗？确认后不可修改明细。' },
            { action: 'sync', label: '同步包裹数量', variant: 'outline', confirmMessage: '确认要根据包裹实际装箱情况同步发货明细吗？' },
        ],
        confirmed: [
            { action: 'sync', label: '同步', variant: 'outline', confirmMessage: '确认要根据包裹实际装箱情况同步发货明细吗？' },
            { action: 'pack', label: '打包', variant: 'primary', confirmMessage: '确认已打包完成？' },
            { action: 'ship', label: '发货', variant: 'outline', confirmMessage: '确认要发货吗？' },
        ],
        packed: [
            { action: 'sync', label: '同步', variant: 'outline', confirmMessage: '确认要根据包裹实际装箱情况同步发货明细吗？' },
            { action: 'ship', label: '发货', variant: 'primary', confirmMessage: '确认要发货吗？' },
        ],
        shipped: [
            { action: 'deliver', label: '签收', variant: 'primary', confirmMessage: '确认已签收？' },
        ],
    };
}

// 保持兼容性 - 默认中文
export const SHIPMENT_ACTIONS = getShipmentActions();

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
        } catch (err) {
            error = getErrorMessage(err, '加载发货批次失败');
        } finally {
            loading = false;
        }
    }

    function goBack() {
        goto('/customer/shipment');
    }

    function updateShipmentItem(updated: { id: number } & Partial<import('$lib/shipmentTypes').ShipmentItem>) {
        if (!shipment?.items) return;
        const idx = shipment.items.findIndex(it => it.id === updated.id);
        if (idx >= 0) {
            shipment.items[idx] = { ...shipment.items[idx], ...updated };
        }
    }

    function removeShipmentItems(ids: number[]) {
        if (!shipment?.items || !ids.length) return;
        const idSet = new Set(ids);
        shipment.items = shipment.items.filter(it => !idSet.has(it.id));
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
        } catch (err) {
            error = getErrorMessage(err, '操作失败');
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
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
            deleting = false;
            showDeleteModal = false;
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
        } catch (err) {
            error = getErrorMessage(err, '加载可用包裹失败');
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
            selectedPackageId = null;
            await loadAvailablePackages();
            return true;
        } catch (err) {
            error = getErrorMessage(err, '关联包裹失败');
            return false;
        } finally {
            linkingPackage = false;
        }
    }

    // 打开关联包裹弹窗
    function openLinkPackageModal() {
        selectedPackageId = null;
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
        updateShipmentItem,
        removeShipmentItems,
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
