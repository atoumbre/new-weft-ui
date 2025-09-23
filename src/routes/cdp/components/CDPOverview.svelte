<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import HealthPill from '$lib/components/common/HealthPill.svelte'
  import { dec, fPercent, fValue } from '$lib/utils/common'

  const { currentCdp, formatCdpId, convertToUsd, borrowingPower } = $props<{
    currentCdp: CollateralizeDebtPositionData
    formatCdpId: (id: string) => string
    convertToUsd: (value?: Decimal | null) => Decimal
    borrowingPower: Decimal
  }>()
</script>

<div class='card bg-base-200/60'>
  <div class='card-body'>
    <div class='flex items-center justify-between mb-4'>
      <h2 class='card-title'>CDP {formatCdpId(currentCdp.id)} Overview</h2>
    </div>

    <div class='grid grid-cols-2 gap-4 md:grid-cols-4'>
      <div class='stat bg-base-100 rounded-lg'>
        <div class='stat-title'>Total Collateral</div>
        <div class='stat-value text-lg'>
          {fValue(convertToUsd(currentCdp.totalCollateralValue))}
        </div>
      </div>
      <div class='stat bg-base-100 rounded-lg'>
        <div class='stat-title'>Total Debt</div>
        <div class='stat-value text-lg'>
          {fValue(convertToUsd(currentCdp.totalLoanValue))}
        </div>
      </div>
      <div class='stat bg-base-100 rounded-lg'>
        <div class='stat-title'>Borrowing Power</div>
        <div class='stat-value text-lg'>
          {fValue(convertToUsd(borrowingPower))}
        </div>
      </div>
      <div class='stat bg-base-100 rounded-lg'>
        <div class='stat-title'>Liquidation LTV</div>
        <div class='stat-value flex items-center gap-2'>
          <HealthPill ltv={currentCdp.liquidationLtv ?? dec(0)} />
          <span class='text-sm font-normal opacity-70'>
            {currentCdp.liquidationLtv ? fPercent(currentCdp.liquidationLtv) : '—'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
