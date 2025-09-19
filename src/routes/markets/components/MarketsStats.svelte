<script lang="ts">
  import type Decimal from 'decimal.js'
  import { fValue } from '$lib/utils'

  const {
    totalSupplied,
    totalBorrowed,
    totalLiquidity,
    totalCollateral,
    onShowSuppliedBreakdown,
    onShowBorrowedBreakdown,
    onShowLiquidityBreakdown,
    onShowCollateralBreakdown,
  } = $props<{
    totalSupplied: Decimal
    totalBorrowed: Decimal
    totalLiquidity: Decimal
    totalCollateral: Decimal
    onShowSuppliedBreakdown: () => void
    onShowBorrowedBreakdown: () => void
    onShowLiquidityBreakdown: () => void
    onShowCollateralBreakdown: () => void
  }>()
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div
    class="stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors"
    onclick={onShowSuppliedBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowSuppliedBreakdown()}
    tabindex="0"
    role="button"
    aria-label="View supplied breakdown"
  >
    <div class="stat-title">Total Supplied</div>
    <div class="stat-value text-xl">{fValue(totalSupplied)}</div>
    <div class="stat-desc text-xs opacity-60">Click for breakdown</div>
  </div>
  <div
    class="stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors"
    onclick={onShowBorrowedBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowBorrowedBreakdown()}
    tabindex="0"
    role="button"
    aria-label="View borrowed breakdown"
  >
    <div class="stat-title">Total Borrowed</div>
    <div class="stat-value text-xl">{fValue(totalBorrowed)}</div>
    <div class="stat-desc text-xs opacity-60">Click for breakdown</div>
  </div>
  <div
    class="stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors"
    onclick={onShowLiquidityBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowLiquidityBreakdown()}
    tabindex="0"
    role="button"
    aria-label="View liquidity breakdown"
  >
    <div class="stat-title">Available Liquidity</div>
    <div class="stat-value text-xl">{fValue(totalLiquidity)}</div>
    <div class="stat-desc text-xs opacity-60">Click for breakdown</div>
  </div>
  <div
    class="stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors"
    onclick={onShowCollateralBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowCollateralBreakdown()}
    tabindex="0"
    role="button"
    aria-label="View collateral breakdown"
  >
    <div class="stat-title">Total Collateral</div>
    <div class="stat-value text-xl">{fValue(totalCollateral)}</div>
    <div class="stat-desc text-xs opacity-60">Click for breakdown</div>
  </div>
</div>
