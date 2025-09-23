<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import HealthPill from '$lib/components/common/HealthPill.svelte'
  import { dec, fValue } from '$lib/utils/common'

  const { cdpList, currentCdp, convertToUsd } = $props<{
    cdpList: CollateralizeDebtPositionData[]
    currentCdp: CollateralizeDebtPositionData | undefined
    convertToUsd: (value?: Decimal | null) => Decimal
  }>()
</script>

{#if cdpList.length > 0}
  <div class='grid grid-cols-1 gap-4 md:grid-cols-4'>
    <div class='stat rounded-lg bg-base-200/60'>
      <div class='stat-title'>Total CDPs</div>
      <div class='stat-value text-xl'>{cdpList.length}</div>
    </div>
    <div class='stat rounded-lg bg-base-200/60'>
      <div class='stat-title'>Total Collateral</div>
      <div class='stat-value text-xl'>
        {#if currentCdp}
          {fValue(convertToUsd(currentCdp.totalCollateralValue))}
        {:else}
          —
        {/if}
      </div>
    </div>
    <div class='stat rounded-lg bg-base-200/60'>
      <div class='stat-title'>Total Debt</div>
      <div class='stat-value text-xl'>
        {#if currentCdp}
          {fValue(convertToUsd(currentCdp.totalLoanValue))}
        {:else}
          —
        {/if}
      </div>
    </div>
    <div class='stat rounded-lg bg-base-200/60'>
      <div class='stat-title'>Health Status</div>
      <div class='stat-value text-xl'>
        {#if currentCdp}
          <HealthPill ltv={currentCdp.liquidationLtv ?? dec(0)} />
        {:else}
          —
        {/if}
      </div>
    </div>
  </div>
{/if}
