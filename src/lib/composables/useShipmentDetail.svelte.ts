/**
 * 发货单详情页共享逻辑
 */
import { goto } from '$app/navigation';
import { shipmentAPI, packageAPI, trackingNumberAPI } from '$lib/api';
import type { Shipment, Package, TrackingNumberBrief, ShipmentItem } from '$lib/shipmentTypes';
import { safeParseFloat } from '$lib/utils';

export interface ShipmentActionConfig {
    action: string;
    label: string;
    variant: 'primary' | 'outline' | 'error';
    confirmMessage: string;
}

// 发货单状态流转配置
export const SHIPMENT_ACTIONS: Record<string, ShipmentActionConfig[]> = {
    draft: [
        { action: 'confirm', label: '确认发货单', variant: 'primary', confirmMessage: '确认要确认此发货单吗？确认后不可修改明细。' },
        { action: 'sync', label: '同步明细', variant: 'outline', confirmMessage: '确认要同步发货明细到包裹吗？' },
    ],
    confirmed: [
        { action: 'pack', label: '打包完成', variant: 'primary', confirmMessage: '确认已打包完成？' },
        { action: 'ship', label: '直接发货', variant: 'outline', confirmMessage: '确认要发货吗？' },
    ],
    packed: [
        { action: 'ship', label: '确认发货', variant: 'primary', confirmMessage: '确认要发货吗？' },
    ],
    shipped: [
        { action: 'deliver', label: '确认签收', variant: 'primary', confirmMessage: '确认已签收？' },
    ],
};

export interface NewPackageForm {
    packageNo: string;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    trackingNumberId: number | null;
    notes: string;
}

export interface ShipmentItemSelection {
    item: ShipmentItem;
    quantity: number;
    selected: boolean;
}

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
    let availableTrackingNumbers = $state<TrackingNumberBrief[]>([]);
    let linkingPackage = $state(false);
    let creatingPackage = $state(false);
    let selectedPackageId = $state<number | null>(null);

    // 新建包裹表单
    let newPackageForm = $state<NewPackageForm>({
        packageNo: '',
        weight: null,
        length: null,
        width: null,
        height: null,
        trackingNumberId: null,
        notes: ''
    });

    // 按发货明细生成包裹内容
    let generateFromItems = $state(true);
    let selectedShipmentItems = $state<ShipmentItemSelection[]>([]);

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

    // 初始化发货明细选择
    function initShipmentItemsSelection() {
        if (!shipment?.items) {
            selectedShipmentItems = [];
            return;
        }
        selectedShipmentItems = shipment.items
            .filter(item => {
                const qty = safeParseFloat(item.quantity);
                const packed = safeParseFloat(item.quantity_packed, 0);
                return qty > packed;
            })
            .map(item => {
                return {
                    item,
                    quantity: 0,
                    selected: true
                };
            });
    }

    // 计算选中的总数量
    function getSelectedTotalQuantity(): number {
        return selectedShipmentItems
            .filter(s => s.quantity > 0)
            .reduce((sum, s) => sum + s.quantity, 0);
    }

    // 计算选中的商品种类数
    function getSelectedItemCount(): number {
        return selectedShipmentItems.filter(s => s.quantity > 0).length;
    }

    // 生成包裹编号
    function generatePackageNo(): string {
        if (!shipment) return '';
        const seq = (shipment.packages?.length || 0) + 1;
        return `${shipment.shipment_no}-PKG${seq.toString().padStart(3, '0')}`;
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

    // 加载可用的快递单号
    async function loadTrackingNumbers() {
        try {
            availableTrackingNumbers = await trackingNumberAPI.listAvailable();
        } catch (err: any) {
            console.error('加载快递单号失败:', err);
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

    // 创建并关联新包裹
    async function createPackage(): Promise<boolean> {
        if (!shipment) return false;
        
        if (!newPackageForm.packageNo.trim()) {
            error = '请输入包裹编号';
            return false;
        }
        
        creatingPackage = true;
        error = '';
        
        try {
            const packageItems = generateFromItems
                ? selectedShipmentItems
                    .filter(s => s.quantity > 0)
                    .map(s => ({
                        shipment_item: s.item.id,
                        quantity: s.quantity,
                        notes: ''
                    }))
                : [];
            
            await packageAPI.create({
                package_no: newPackageForm.packageNo,
                sequence_no: (shipment.packages?.length || 0) + 1,
                weight: newPackageForm.weight || undefined,
                length: newPackageForm.length || undefined,
                width: newPackageForm.width || undefined,
                height: newPackageForm.height || undefined,
                tracking_number: newPackageForm.trackingNumberId || undefined,
                notes: newPackageForm.notes,
                items: packageItems,
                shipment_id: shipment.id
            });
            
            await loadShipment();
            showNewPackageModal = false;
            
            // 重置表单
            resetPackageForm();
            return true;
        } catch (err: any) {
            error = err.message || '创建包裹失败';
            return false;
        } finally {
            creatingPackage = false;
        }
    }

    function resetPackageForm() {
        newPackageForm = {
            packageNo: '',
            weight: null,
            length: null,
            width: null,
            height: null,
            trackingNumberId: null,
            notes: ''
        };
        generateFromItems = true;
        selectedShipmentItems = [];
    }

    // 打开新建包裹弹窗时的初始化
    function openNewPackageModal() {
        showNewPackageModal = true;
        loadTrackingNumbers();
        newPackageForm.packageNo = generatePackageNo();
        generateFromItems = true;
        initShipmentItemsSelection();
    }

    // 打开关联包裹弹窗
    function openLinkPackageModal() {
        showLinkPackageModal = true;
        loadAvailablePackages();
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
        get availableTrackingNumbers() { return availableTrackingNumbers; },
        get linkingPackage() { return linkingPackage; },
        get creatingPackage() { return creatingPackage; },
        get selectedPackageId() { return selectedPackageId; },
        set selectedPackageId(value) { selectedPackageId = value; },
        get newPackageForm() { return newPackageForm; },
        set newPackageForm(value) { newPackageForm = value; },

        get selectedShipmentItems() { return selectedShipmentItems; },
        set selectedShipmentItems(value) { selectedShipmentItems = value; },
        get generateFromItems() { return generateFromItems; },
        set generateFromItems(value) { generateFromItems = value; },
        
        // 方法
        loadShipment,
        goBack,
        goToEdit,
        executeAction,
        deleteShipment,
        goToPackageDetail,
        getSelectedTotalQuantity,
        getSelectedItemCount,
        linkPackage,
        createPackage,
        openNewPackageModal,
        openLinkPackageModal,
        resetPackageForm,
    };
}
