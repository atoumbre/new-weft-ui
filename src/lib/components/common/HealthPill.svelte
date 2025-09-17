<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { dec } from '$lib/utils'

  type Props = { ltv?: Decimal, showValue?: boolean }
  const { ltv = dec(0), showValue = false }: Props = $props()

  const { color, label } = $derived.by(() => {
    const ltvNumber = ltv.toNumber()

    if (ltvNumber < 0.7)
      return { color: 'badge-success', label: 'Safe' }
    if (ltvNumber < 0.9)
      return { color: 'badge-warning', label: 'Moderate' }
    return { color: 'badge-error', label: 'At Risk' }
  })

</script>

<div class={`badge ${color} gap-1`}>{label}{showValue ? ` · ${ltv.toFixed(2)}` : ''}</div>
