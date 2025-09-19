<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { fValue } from '$lib/utils/common'

  const {
    totalCollateralValue,
    totalDebtValue,
    atRiskLoanAmount,
    atRiskCdpCount,
    totalCdpCount,
    onShowCdpHealthBreakdown,
    onShowAtRiskBreakdown,
    onShowCollateralBreakdown,
    onShowDebtBreakdown,
    onShowRiskyDebtBreakdown,
  } = $props<{
    totalCollateralValue: Decimal
    totalDebtValue: Decimal
    atRiskLoanAmount: Decimal
    atRiskCdpCount: number
    totalCdpCount: number
    onShowCdpHealthBreakdown: () => void
    onShowAtRiskBreakdown: () => void
    onShowCollateralBreakdown: () => void
    onShowDebtBreakdown: () => void
    onShowRiskyDebtBreakdown: () => void
  }>()
</script>

<div class='grid grid-cols-1 gap-4 md:grid-cols-5'>
  <div
    class='stat cursor-pointer rounded-lg bg-base-200/60 transition-colors hover:bg-base-300/60'
    onclick={onShowCdpHealthBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowCdpHealthBreakdown()}
    tabindex='0'
    role='button'
    aria-label='View total CDP health breakdown'
  >
    <div class='stat-title'>Total CDPs</div>
    <div class='stat-value text-xl'>{totalCdpCount}</div>
    <div class='stat-desc text-xs opacity-60'>Click for health breakdown</div>
  </div>
  <div
    class='stat cursor-pointer rounded-lg bg-base-200/60 transition-colors hover:bg-base-300/60'
    onclick={onShowCollateralBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowCollateralBreakdown()}
    tabindex='0'
    role='button'
    aria-label='View total collateral breakdown'
  >
    <div class='stat-title'>Total Collateral</div>
    <div class='stat-value text-xl'>{fValue(totalCollateralValue)}</div>
    <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
  </div>
  <div
    class='stat cursor-pointer rounded-lg bg-base-200/60 transition-colors hover:bg-base-300/60'
    onclick={onShowDebtBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowDebtBreakdown()}
    tabindex='0'
    role='button'
    aria-label='View total debt breakdown'
  >
    <div class='stat-title'>Total Debt</div>
    <div class='stat-value text-xl'>{fValue(totalDebtValue)}</div>
    <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
  </div>
  <div
    class='stat cursor-pointer rounded-lg bg-base-200/60 transition-colors hover:bg-base-300/60'
    onclick={onShowRiskyDebtBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowRiskyDebtBreakdown()}
    tabindex='0'
    role='button'
    aria-label='View total risky debt breakdown'
  >
    <div class='stat-title'>Total Risky Debt</div>
    <div class='stat-value text-xl text-warning'>{fValue(atRiskLoanAmount)}</div>
    <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
  </div>
  <div
    class='stat cursor-pointer rounded-lg bg-base-200/60 transition-colors hover:bg-base-300/60'
    onclick={onShowAtRiskBreakdown}
    onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onShowAtRiskBreakdown()}
    tabindex='0'
    role='button'
    aria-label='View at-risk CDP breakdown'
  >
    <div class='stat-title'>At Risk CDPs</div>
    <div class='stat-value text-2xl text-warning'>{atRiskCdpCount}</div>
    <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
  </div>
</div>
