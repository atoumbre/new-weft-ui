<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist';
  import { inEfficiency } from '$lib/stores/cdp-store.svelte';

  type Props = { cdp?: CollateralizeDebtPositionData, showValue?: boolean }
  const { cdp , showValue = false }: Props = $props()

  const { color, label } = $derived.by(() => {



  if (inEfficiency(cdp))
  return { color: 'badge-alt', label: 'Efficiency ⚡️' }

    const ltvNumber = cdp?.liquidationLtv.toNumber() ?? 0

    if (ltvNumber < (0.7 * 1.00))
      return { color: 'badge-success', label: 'Safe' }
    if (ltvNumber < (0.9 * 1.00))
    return { color: 'badge-warning', label: 'Moderate' }
  
  if (ltvNumber < (1.0 * 1.00))
      return { color: 'badge-error', label: 'Unsafe' }
    return { color: 'badge-error', label: 'Liquidation Risk' }
  })

</script>

<div class={`badge ${color} gap-1`}>{label}{showValue ? ` · ${cdp?.liquidationLtv.toFixed(2)}` : ''}</div>
