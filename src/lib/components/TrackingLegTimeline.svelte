<!-- 追踪轨迹时间线 -->
<script lang="ts">
    import type { PackageTrackingLeg } from '$lib/shipmentTypes';

    interface Props {
        legs?: PackageTrackingLeg[];
        currentLegNo?: number;
    }

    let { legs = [], currentLegNo = 0 }: Props = $props();

    const stageColor: Record<string, string> = {
        first: 'bg-sky-100 text-sky-700 border-sky-300',
        middle: 'bg-amber-100 text-amber-700 border-amber-300',
        last: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    };

    const statusColor: Record<string, string> = {
        pending: 'text-slate-500',
        collected: 'text-blue-600',
        in_transit: 'text-amber-600',
        delivered: 'text-emerald-600',
        exception: 'text-red-600',
        returned: 'text-orange-600',
        cancelled: 'text-slate-400',
    };
</script>

{#if legs.length === 0}
    <div class="text-sm text-slate-400 italic">暂无物流段</div>
{:else}
    <ol class="relative border-l-2 border-slate-200 ml-2 space-y-4">
        {#each legs as leg (leg.id)}
            {@const isCurrent = leg.leg_no === currentLegNo}
            <li class="ml-4">
                <span
                    class="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white {isCurrent ? 'bg-blue-500' : 'bg-slate-300'}"
                ></span>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-xs font-mono text-slate-500">第 {leg.leg_no} 段</span>
                    <span class="px-2 py-0.5 text-xs rounded border {stageColor[leg.stage] ?? stageColor.middle}">
                        {leg.stage_display ?? leg.stage}
                    </span>
                    {#if leg.logistics_status_display}
                        <span class="text-xs font-medium {statusColor[leg.logistics_status ?? ''] ?? 'text-slate-600'}">
                            {leg.logistics_status_display}
                        </span>
                    {/if}
                    {#if isCurrent}
                        <span class="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">当前</span>
                    {/if}
                </div>
                <div class="text-sm">
                    {#if leg.tracking_number_detail}
                        <span class="font-medium">{leg.tracking_number_detail.carrier_name}</span>
                        <a
                            href="/customer/shipment/tracking-number?open={leg.tracking_number_detail.id}"
                            class="font-mono text-blue-600 hover:text-blue-800 hover:underline ml-1"
                            title="查看物流详情"
                        >
                            {leg.tracking_number_detail.tracking_no}
                        </a>
                    {/if}
                </div>
                {#if leg.from_location || leg.to_location || leg.agent_name}
                    <div class="text-xs text-slate-500 mt-0.5">
                        {leg.from_location || '?'} → {leg.to_location || '?'}
                        {#if leg.agent_name}<span class="ml-2">代理: {leg.agent_name}</span>{/if}
                    </div>
                {/if}
                {#if leg.handover_at}
                    <div class="text-xs text-slate-400 mt-0.5">交接: {new Date(leg.handover_at).toLocaleString()}</div>
                {/if}
                {#if leg.notes}
                    <div class="text-xs text-slate-500 mt-0.5">{leg.notes}</div>
                {/if}
            </li>
        {/each}
    </ol>
{/if}
