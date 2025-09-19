<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { dec } from '$lib/utils'

  type Props = { value?: Decimal }
  const { value = dec(0) }: Props = $props() // 0..100

  const val = $derived.by(() => value ?? dec(0))
  const pctStr = $derived.by(() => {
    const clamped = val.lessThan(0) ? dec(0) : val.greaterThan(100) ? dec(100) : val
    return clamped.toFixed(0)
  })
</script>

<div class='space-y-1' aria-label={`Utilization ${pctStr}%`}>
  <div class='flex items-center justify-between text-xs opacity-70'>
    <span class='tabular-nums'>{pctStr}%</span>
  </div>
  <div class='h-2 w-full overflow-hidden rounded bg-base-300'>
    <div class='h-2 bg-primary' style={`width: ${pctStr}%`}></div>
  </div>
</div>
