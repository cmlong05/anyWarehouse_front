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

    type TrackingHintKind = 'none' | 'info' | 'warn';

    let saving = $state(false);
    let error = $state('');
    let trackingQuery = $state('');
    let trackingLoading = $state(false);
    let trackingHint = $state('');
    let trackingHintKind = $state<TrackingHintKind>('none');
    let trackingRequestToken = 0;
    // svelte-ignore state_referenced_locally
    let recentTrackingList = $state<TrackingNumberBrief[]>(availableTrackingNumbers);

    // svelte-ignore state_referenced_locally
    let trackingList = $state<TrackingNumberBrief[]>(availableTrackingNumbers);

    function upsertTrackingOption(tracking: TrackingNumberBrief) {
        const existing = trackingList.find((item) => item.id === tracking.id);
        if (existing) return;
        trackingList = [tracking, ...trackingList];
        recentTrackingList = recentTrackingList.some((item) => item.id === tracking.id)
            ? recentTrackingList
            : [tracking, ...recentTrackingList].slice(0, 10);
    }

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
    // 文本输入避免 number 输入框上下角标；提交前再转为数字
    let legNoInput = $state(form.leg_no ? String(form.leg_no) : '');

    function toTrackingBrief(tracking: Awaited<ReturnType<typeof trackingNumberAPI.get>>): TrackingNumberBrief {
        return {
            id: tracking.id,
            tracking_no: tracking.tracking_no,
            carrier_name: tracking.carrier_name,
            carrier_code: tracking.carrier_code,
            logistics_status: tracking.logistics_status,
            is_linked: tracking.is_linked,
            shippo_registered: tracking.shippo_registered,
            remark: tracking.remark,
            created_at: tracking.created_at,
        };
    }

    async function loadTrackingList(search = '', token = ++trackingRequestToken) {
        trackingLoading = search.length >= 2 || trackingList.length === 0;
        trackingHint = '';
        trackingHintKind = 'none';

        try {
            const res = await trackingNumberAPI.listRecent(10, search);
            let fetchedList = res.results ?? [];

            if (!search) {
                recentTrackingList = fetchedList;
            }

            if (leg?.tracking_number && !fetchedList.some((tn) => tn.id === leg.tracking_number)) {
                const currentTracking = await trackingNumberAPI.get(leg.tracking_number);
                fetchedList = [toTrackingBrief(currentTracking), ...fetchedList];
            }

            if (token !== trackingRequestToken) return;
            trackingList = fetchedList;
            if (!trackingQuery && leg?.tracking_number) {
                const current = fetchedList.find((tn) => tn.id === leg.tracking_number);
                if (current) {
                    trackingQuery = current.tracking_no;
                }
            }
            if (search.length >= 2 && fetchedList.length === 0) {
                trackingHint = '未找到匹配单号';
                trackingHintKind = 'warn';
            }
        } catch (e) {
            if (token !== trackingRequestToken) return;
            trackingHint = getErrorMessage(e, '查询快递单号失败');
            trackingHintKind = 'warn';
        } finally {
            if (token === trackingRequestToken) {
                trackingLoading = false;
            }
        }
    }

    $effect(() => {
        const keyword = trackingQuery.trim();

        if (!keyword) {
            void loadTrackingList('', ++trackingRequestToken);
            return;
        }

        if (keyword.length < 2) {
            trackingHint = '至少输入 2 个字符开始搜索';
            trackingHintKind = 'info';
            trackingLoading = false;
            trackingList = recentTrackingList;
            return;
        }

        const token = ++trackingRequestToken;
        trackingHint = '输入中…';
        trackingHintKind = 'info';
        const timer = window.setTimeout(() => {
            void loadTrackingList(keyword, token);
        }, 300);

        return () => window.clearTimeout(timer);
    });

    $effect(() => {
        const keyword = trackingQuery.trim();
        if (!keyword) return;
        const matched = trackingList.find((tn) => tn.tracking_no === keyword)
            ?? recentTrackingList.find((tn) => tn.tracking_no === keyword);
        if (matched) {
            form.tracking_number = matched.id;
        }
    });

    async function resolveTrackingNumberId(): Promise<number | null> {
        const trackingNo = trackingQuery.trim();
        const selected = trackingList.find((item) => item.id === form.tracking_number)
            ?? recentTrackingList.find((item) => item.id === form.tracking_number);

        if (trackingNo && selected?.tracking_no !== trackingNo) {
            const matched = await trackingNumberAPI.lookup(trackingNo);
            upsertTrackingOption(matched);
            form.tracking_number = matched.id;
            trackingQuery = matched.tracking_no;
            return matched.id;
        }

        return form.tracking_number || null;
    }

    async function submit(e: Event) {
        e.preventDefault();
        saving = true;
        error = '';
        try {
            const resolvedTrackingNumberId = await resolveTrackingNumberId();
            if (!resolvedTrackingNumberId) {
                error = '请选择或输入快递单号';
                return;
            }
            const parsedLegNo = legNoInput.trim() ? Number.parseInt(legNoInput.trim(), 10) : undefined;
            if (parsedLegNo !== undefined && (!Number.isInteger(parsedLegNo) || parsedLegNo < 1)) {
                error = '段序号需为大于等于 1 的整数';
                return;
            }
            const payload: PackageTrackingLegRequest = {
                ...form,
                package: packageId,
                tracking_number: resolvedTrackingNumberId,
                leg_no: parsedLegNo,
            };
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
            <span class="text-xs text-slate-600">段序号</span>
            <input type="text" inputmode="numeric" pattern="[0-9]*" bind:value={legNoInput}
                class="w-full border rounded px-2 py-1 text-sm" />
        </label>
        <label class="block">
            <span class="text-xs text-slate-600">阶段</span>
            <Svelecte options={stages} bind:value={form.stage} class="svelecte-control" />
        </label>
    </div>

    <label class="block">
        <span class="text-xs text-slate-600">快递单号 *（可输入搜索）</span>
        <input type="text" list="tracking-no-options" bind:value={trackingQuery}
            class="w-full border rounded px-2 py-1 text-sm"
            placeholder="输入单号/承运商，300ms 防抖搜索" />
        <datalist id="tracking-no-options">
            {#each trackingList as tn (tn.id)}
                <option value={tn.tracking_no} label={`${tn.carrier_name} (${tn.tracking_no})`}></option>
            {/each}
        </datalist>
    </label>

    {#if trackingLoading || trackingHint}
        <p class={`text-xs ${trackingHintKind === 'warn' && !trackingLoading ? 'text-amber-600' : 'text-slate-500'}`}>
            {#if trackingLoading}
                正在查询快递单号…
            {:else}
                {trackingHint}
            {/if}
        </p>
    {/if}

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


