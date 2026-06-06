<!-- 追踪轨迹表单 -->
<!--
被依赖：
- `routes/customer/package/[id]/+page.svelte`
-->
<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
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

    interface TrackingOption {
        value: number;
        label: string;
        tracking_no: string;
        carrier_name: string;
    }

    type TrackingHintKind = 'none' | 'warn';

    const TRACKING_INPUT_ID = 'tracking-no-input';
    const SEARCH_DEBOUNCE_MS = 300;
    const LOCAL_MIN_CHARS = 2;
    const BACKEND_MIN_CHARS = 3;

    let { packageId, leg = null, availableTrackingNumbers = [], onsaved, oncancel }: Props = $props();

    let saving = $state(false);
    let error = $state('');
    let trackingHint = $state('');
    let trackingHintKind = $state<TrackingHintKind>('none');
    let trackingOptions = $state<TrackingOption[]>([]);
    let selectedTrackingOption = $state<TrackingOption | null>(null);

    let recentOptions: TrackingOption[] = [];
    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    let inputEl: HTMLInputElement | null = null;

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

    function toTrackingOption(t: { id: number; tracking_no: string; carrier_name?: string }): TrackingOption {
        return {
            value: t.id,
            label: `${t.tracking_no} (${t.carrier_name || '未知承运商'})`,
            tracking_no: t.tracking_no,
            carrier_name: t.carrier_name || '',
        };
    }

    function syncSelection(option: TrackingOption | null) {
        form.tracking_number = option ? option.value : 0;
    }

    function handleTrackingChange() {
        syncSelection(selectedTrackingOption);
    }

    /** 在本地最近 10 条中匹配（包含子串、大小写不敏感） */
    function localMatches(query: string): TrackingOption[] {
        const q = query.toLowerCase();
        return recentOptions.filter(
            (o) => o.tracking_no.toLowerCase().includes(q) || o.carrier_name.toLowerCase().includes(q),
        );
    }

    async function searchBackend(query: string) {
        try {
            const resp = await trackingNumberAPI.listRecent(10, query);
            const fetched = resp.results.map(toTrackingOption);
            trackingOptions = fetched;
            if (fetched.length === 0) {
                trackingHint = '未找到匹配单号';
                trackingHintKind = 'warn';
            } else {
                trackingHint = '';
                trackingHintKind = 'none';
            }
        } catch (e) {
            trackingHint = getErrorMessage(e, '查询快递单号失败');
            trackingHintKind = 'warn';
        }
    }

    function evaluateOptions(query: string) {
        if (searchTimer) clearTimeout(searchTimer);

        // 小于本地阈值：不过滤，显示全部最近 10 条
        if (query.length < LOCAL_MIN_CHARS) {
            trackingOptions = recentOptions;
            trackingHint = '';
            trackingHintKind = 'none';
            return;
        }

        // 达到本地阈值：本地过滤
        const local = localMatches(query);
        if (local.length > 0) {
            trackingOptions = local;
            trackingHint = '';
            trackingHintKind = 'none';
            return;
        }

        // 本地无匹配，但未达到后端阈值：仅清空列表并提示
        if (query.length < BACKEND_MIN_CHARS) {
            trackingOptions = [];
            trackingHint = `输入至少 ${BACKEND_MIN_CHARS} 个字符以查询后端`;
            trackingHintKind = 'warn';
            return;
        }

        searchTimer = setTimeout(() => searchBackend(query), SEARCH_DEBOUNCE_MS);
    }

    function handleInput(ev: Event) {
        evaluateOptions((ev.target as HTMLInputElement).value.trim());
    }

    // 重新聚焦时 Svelecte 默认会清空输入，需重新填上最近 10 条
    function handleFocus(ev: FocusEvent) {
        evaluateOptions((ev.target as HTMLInputElement).value.trim());
    }

    // 点击 svelecte 容器以外主动 blur，否则在 modal 背景上点击不会触发 input.blur → 下拉关不掉
    function handlePointerDownOutside(ev: PointerEvent) {
        if (!inputEl || document.activeElement !== inputEl) return;
        const target = ev.target as HTMLElement | null;
        if (target?.closest('.svelecte') === inputEl.closest('.svelecte')) return;
        inputEl.blur();
    }

    onMount(async () => {
        try {
            const recent = await trackingNumberAPI.listRecent(10);
            recentOptions = recent.results.map(toTrackingOption);
            trackingOptions = recentOptions;
        } catch (e) {
            trackingHint = getErrorMessage(e, '加载最近快递单号失败');
            trackingHintKind = 'warn';
        }

        if (leg?.tracking_number) {
            let brief: { id: number; tracking_no: string; carrier_name?: string } | null =
                leg.tracking_number_detail
                ?? availableTrackingNumbers.find((t) => t.id === leg.tracking_number)
                ?? null;

            if (!brief) {
                try {
                    brief = await trackingNumberAPI.get(leg.tracking_number);
                } catch (e) {
                    trackingHint = getErrorMessage(e, '加载当前快递单号失败');
                    trackingHintKind = 'warn';
                }
            }

            if (brief) {
                const option = toTrackingOption(brief);
                if (!trackingOptions.some((o) => o.value === option.value)) {
                    trackingOptions = [option, ...trackingOptions];
                }
                selectedTrackingOption = option;
                syncSelection(option);
            }
        }

        await tick();
        inputEl = document.getElementById(TRACKING_INPUT_ID) as HTMLInputElement | null;
        inputEl?.addEventListener('input', handleInput);
        inputEl?.addEventListener('focus', handleFocus);
        document.addEventListener('pointerdown', handlePointerDownOutside);
    });

    onDestroy(() => {
        if (searchTimer) clearTimeout(searchTimer);
        inputEl?.removeEventListener('input', handleInput);
        inputEl?.removeEventListener('focus', handleFocus);
        document.removeEventListener('pointerdown', handlePointerDownOutside);
    });

    function resolveTrackingNumberId(): number | null {
        if (selectedTrackingOption) return selectedTrackingOption.value;
        return form.tracking_number > 0 ? form.tracking_number : null;
    }

    async function submit(e: Event) {
        e.preventDefault();
        saving = true;
        error = '';
        try {
            const resolvedTrackingNumberId = resolveTrackingNumberId();
            if (!resolvedTrackingNumberId) {
                error = '请选择快递单号';
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

    <div class="flex items-center gap-2">
        <span class="text-xs text-slate-600 shrink-0">快递单号 *</span>
        <div class="flex-1">
            <Svelecte
                inputId={TRACKING_INPUT_ID}
                options={trackingOptions}
                bind:value={selectedTrackingOption}
                valueAsObject={true}
                searchable={true}
                clearable={true}
                disabled={saving}
                placeholder="输入单号/承运商搜索"
                class="svelecte-control"
                valueField="value"
                labelField="label"
                searchProps={{ disabled: true }}
                minQuery={0}
                onChange={handleTrackingChange}
            />
        </div>
    </div>

    {#if trackingHint}
        <p class={`text-xs ${trackingHintKind === 'warn' ? 'text-amber-600' : 'text-slate-500'}`}>
            {trackingHint}
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

