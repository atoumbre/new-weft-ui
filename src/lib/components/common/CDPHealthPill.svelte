<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/weft-ledger-state'
  import { inEfficiency } from '$lib/stores/cdp-store.svelte'
  import { resolveCdpHealthDefinition } from '$lib/utils/health'

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
