<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { fValue } from '$lib/utils/common'

  const { totalSupplied, totalBorrowed, totalLiquidity, totalCollateral, totalLentCollateral } = $props<{
    totalSupplied: Decimal
    totalBorrowed: Decimal
    totalLiquidity: Decimal
    totalCollateral: Decimal
    totalLentCollateral: Decimal
  }>()
</script>

<div class='grid grid-cols-1 gap-4 md:grid-cols-5'>
  <div class='stat rounded-lg bg-base-200/60'>
    <div class='stat-title'>Total Supplied</div>
    <div class='stat-value text-xl'>{fValue(totalSupplied)}</div>
  </div>
  <div class='stat rounded-lg bg-base-200/60'>
    <div class='stat-title'>Total Borrowed</div>
    <div class='stat-value text-xl'>{fValue(totalBorrowed)}</div>
  </div>
  <div class='stat rounded-lg bg-base-200/60'>
    <div class='stat-title'>Available Liquidity</div>
    <div class='stat-value text-xl'>{fValue(totalLiquidity)}</div>
  </div>
  <div class='stat rounded-lg bg-base-200/60'>
    <div class='stat-title'>Total Collateral</div>
    <div class='stat-value text-xl'>{fValue(totalCollateral)}</div>
  </div>
  <div class='stat rounded-lg bg-base-200/60'>
    <div class='stat-title'>Total Lent Collateral</div>
    <div class='stat-value text-xl'>{fValue(totalLentCollateral)}</div>
  </div>
</div>
