<script lang="ts">
    import Svelecte from 'svelecte';
    import type { PackageTrackingLeg, PackageTrackingLegRequest, TrackingNumberBrief, TrackingLegStage } from '$lib/shipmentTypes';
    import { packageTrackingLegAPI, trackingNumberAPI } from '$lib/api';
    import { getErrorMessage } from '$lib/utils/errors';

    interface Props {
        packageId: number;
        leg?: PackageTrackingLeg | null;
        availableTrackingNumbers?: TrackingNumberBrief[];
        onsaved?: (leg: PackageTrackingLeg) => void;
        oncancel?: () => void;
    }

    let { packageId, leg = null, availableTrackingNumbers = [], onsaved, oncancel }: Props = $props();

    let saving = $state(false);
    let error = $state('');
    // svelte-ignore state_referenced_locally
    let trackingList = $state<TrackingNumberBrief[]>(availableTrackingNumbers);

    const stages: { value: TrackingLegStage; label: string }[] = [
        { value: 'first', label: '首段' },
        { value: 'middle', label: '中间段' },
        { value: 'last', label: '末段' },
    ];

    // 父组件通过 {#if showLegForm} 控制挂载/卸载，每次打开都会重新创建组件并读取最新的 leg prop。
    // svelte-ignore state_referenced_locally
    let form = $state<PackageTrackingLegRequest>({
        package: packageId,
        tracking_number: leg?.tracking_number ?? 0,
        leg_no: leg?.leg_no,
        stage: leg?.stage ?? 'first',
        agent_name: leg?.agent_name ?? '',
        from_location: leg?.from_location ?? '',
        to_location: leg?.to_location ?? '',
        handover_at: leg?.handover_at ?? null,
        notes: leg?.notes ?? '',
    });

    async function ensureTrackingList() {
        if (trackingList.length === 0) {
            const res = await trackingNumberAPI.list();
            trackingList = Array.isArray(res) ? res : (res.results ?? []);
        }
    }
    ensureTrackingList();

    let trackingOptions = $derived(trackingList.map(tn => ({
        value: tn.id,
        label: `${tn.carrier_name} - ${tn.tracking_no}`,
    })));

    async function submit(e: Event) {
        e.preventDefault();
        saving = true;
        error = '';
        try {
            if (!form.tracking_number) {
                error = '请选择快递单号';
                return;
            }
            const payload: PackageTrackingLegRequest = { ...form, package: packageId };
            if (!payload.leg_no) {
                delete (payload as Partial<PackageTrackingLegRequest>).leg_no;
            }
            const result = leg
                ? await packageTrackingLegAPI.update(leg.id, payload)
                : await packageTrackingLegAPI.create(payload);
            onsaved?.(result);
        } catch (e) {
            error = getErrorMessage(e);
        } finally {
            saving = false;
        }
    }
</script>

<form onsubmit={submit} class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
        <label class="block">
            <span class="text-xs text-slate-600">段序号（留空自动分配）</span>
            <input type="number" min="1" bind:value={form.leg_no}
                class="w-full border rounded px-2 py-1 text-sm" />
        </label>
        <label class="block">
            <span class="text-xs text-slate-600">阶段</span>
            <Svelecte options={stages} bind:value={form.stage} class="svelecte-control" />
        </label>
    </div>

    <label class="block">
        <span class="text-xs text-slate-600">快递单号 *</span>
        <Svelecte options={trackingOptions} bind:value={form.tracking_number}
            placeholder="搜索/选择快递单号..." class="svelecte-control" />
    </label>

    <div class="grid grid-cols-2 gap-3">
        <label class="block">
            <span class="text-xs text-slate-600">起始地</span>
            <input type="text" bind:value={form.from_location}
                class="w-full border rounded px-2 py-1 text-sm" placeholder="如：深圳" />
        </label>
        <label class="block">
            <span class="text-xs text-slate-600">目的地</span>
            <input type="text" bind:value={form.to_location}
                class="w-full border rounded px-2 py-1 text-sm" placeholder="如：上海/美国" />
        </label>
    </div>

    <label class="block">
        <span class="text-xs text-slate-600">货运代理 / 承运方</span>
        <input type="text" bind:value={form.agent_name}
            class="w-full border rounded px-2 py-1 text-sm" placeholder="如：上海XX货代" />
    </label>

    <label class="block">
        <span class="text-xs text-slate-600">交接时间</span>
        <input type="datetime-local" bind:value={form.handover_at}
            class="w-full border rounded px-2 py-1 text-sm" />
    </label>

    <label class="block">
        <span class="text-xs text-slate-600">备注</span>
        <input type="text" bind:value={form.notes} class="w-full border rounded px-2 py-1 text-sm" />
    </label>

    {#if error}
        <p class="text-sm text-red-600">{error}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="px-3 py-1 text-sm rounded border"
            onclick={() => oncancel?.()}>取消</button>
        <button type="submit" disabled={saving}
            class="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50">
            {saving ? '保存中…' : '保存'}
        </button>
    </div>
</form>


