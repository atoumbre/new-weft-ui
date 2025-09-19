<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import { resolveCdpHealthDefinition } from '$lib/cdp/health'
  import { inEfficiency } from '$lib/stores/cdp-store.svelte'

  type Props = { cdp?: CollateralizeDebtPositionData, showValue?: boolean }
  const { cdp, showValue = false }: Props = $props()

  const { color, label } = $derived.by(() => {
    if (inEfficiency(cdp))
      return { color: 'badge-alt', label: 'Efficiency ⚡️' }

    const label = resolveCdpHealthDefinition(cdp?.liquidationLtv)

    return {
      color: label.badgeClass,
      label: label.shortLabel,
    }
  })
</script>

<div class={`badge ${color} gap-1`}>
  {label}{showValue ? ` · ${cdp?.liquidationLtv.toFixed(2)}` : ''}
</div>
