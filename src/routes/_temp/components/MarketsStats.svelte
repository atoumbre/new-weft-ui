<script lang="ts">
  import type Decimal from 'decimal.js'
  import { fValue } from '$lib/utils'

  const {
    totalSupplied,
    totalBorrowed,
    totalLiquidity,
    totalCollateral,
  } = $props<{
    totalSupplied: Decimal
    totalBorrowed: Decimal
    totalLiquidity: Decimal
    totalCollateral: Decimal
  }>()
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div class="stat bg-base-200/60 rounded-lg">
    <div class="stat-title">Total Supplied</div>
    <div class="stat-value text-xl">{fValue(totalSupplied)}</div>
  </div>
  <div class="stat bg-base-200/60 rounded-lg">
    <div class="stat-title">Total Borrowed</div>
    <div class="stat-value text-xl">{fValue(totalBorrowed)}</div>
  </div>
  <div class="stat bg-base-200/60 rounded-lg">
    <div class="stat-title">Available Liquidity</div>
    <div class="stat-value text-xl">{fValue(totalLiquidity)}</div>
  </div>
  <div class="stat bg-base-200/60 rounded-lg">
    <div class="stat-title">Total Collateral</div>
    <div class="stat-value text-xl">{fValue(totalCollateral)}</div>
  </div>
</div>
