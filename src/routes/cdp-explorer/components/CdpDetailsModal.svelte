<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import CDPHealthPill from '$lib/components/common/CDPHealthPill.svelte'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'
  import { dec, fValue } from '$lib/utils/common'

  const { cdp, onClose, formatLtv, getHealthColor, xrdPrice } = $props<{
    cdp: CollateralizeDebtPositionData
    onClose: () => void
    formatLtv: (ltv: number) => string
    getHealthColor: (ltv: number) => string
    xrdPrice: Decimal
  }>()

  const convertXrdToUsd = (value: Decimal | undefined | null) => {
    if (!value)
      return dec(0)
    return value.mul(xrdPrice)
  }
</script>

<div
  class='modal-open modal'
  role='dialog'
  aria-labelledby='cdp-modal-title'
  tabindex='-1'
  onclick={onClose}
  onkeydown={e => e.key === 'Escape' && onClose()}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class='modal-box max-w-4xl'
    role='document'
    onclick={event => event.stopPropagation()}
    onkeydown={event => event.stopPropagation()}
  >
    <div class='mb-4 flex items-center justify-between'>
      <h3 id='cdp-modal-title' class='text-lg font-bold'>CDP Details - {cdp.id}</h3>
      <button class='btn btn-circle btn-ghost btn-sm' onclick={onClose}>✕</button>
    </div>

    <div class='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <div class='space-y-4'>
        <h4 class='border-b pb-2 text-base font-semibold'>Overview</h4>
        <div class='grid grid-cols-2 gap-4'>
          <div class='stat rounded-lg bg-base-200/60 p-3'>
            <div class='stat-title text-xs'>Total Loan</div>
            <div class='stat-value text-lg'>{fValue(convertXrdToUsd(cdp.totalLoanValue))}</div>
          </div>
          <div class='stat rounded-lg bg-base-200/60 p-3'>
            <div class='stat-title text-xs'>Total Collateral</div>
            <div class='stat-value text-lg'>
              {fValue(convertXrdToUsd(cdp.totalCollateralValue))}
            </div>
          </div>
          <div class='stat rounded-lg bg-base-200/60 p-3'>
            <div class='stat-title text-xs'>Liquidation LTV</div>
            <div
              class={`stat-value text-lg ${getHealthColor(cdp.liquidationLtv?.toNumber() || 0)}`}
            >
              {cdp.liquidationLtv ? formatLtv(cdp.liquidationLtv.toNumber()) : '-'}
            </div>
          </div>
          <div class='stat rounded-lg bg-base-200/60 p-3'>
            <div class='stat-title text-xs'>Health Factor</div>
            <div class='stat-value text-lg'>
              <CDPHealthPill {cdp} />
            </div>
          </div>
        </div>
      </div>

      <div class='space-y-4'>
        <h4 class='border-b pb-2 text-base font-semibold'>Loan Positions</h4>
        <div class='max-h-64 space-y-2 overflow-y-auto'>
          {#if Object.keys(cdp.loanPositions || {}).length > 0}
            {#each Object.entries(cdp.loanPositions || {}) as [resourceAddress, loan]}
              <div class='rounded-lg bg-base-200/60 p-3'>
                <CollateralPositionDisplay
                  {resourceAddress}
                  amount={dec((loan as any).amount || 0)}
                  usdValue={convertXrdToUsd((loan as any).value)}
                  fullPrecision={true}
                />
              </div>
            {/each}
          {:else}
            <div class='py-4 text-center text-base-content/60'>No loan positions</div>
          {/if}
        </div>
      </div>

      <div class='space-y-4'>
        <h4 class='border-b pb-2 text-base font-semibold'>Collateral Positions</h4>
        <div class='max-h-64 space-y-2 overflow-y-auto'>
          {#if Object.keys(cdp.collateralPositions || {}).length > 0}
            {#each Object.entries(cdp.collateralPositions || {}) as [resourceAddress, collateral]}
              <div class='rounded-lg bg-base-200/60 p-3'>
                <CollateralPositionDisplay
                  {resourceAddress}
                  amount={dec((collateral as any).amount || 0)}
                  usdValue={convertXrdToUsd((collateral as any).value)}
                  fullPrecision={true}
                />
              </div>
            {/each}
          {:else}
            <div class='py-4 text-center text-base-content/60'>No collateral positions</div>
          {/if}
        </div>
      </div>

      <div class='space-y-4'>
        <h4 class='border-b pb-2 text-base font-semibold'>NFT Collateral</h4>
        <div class='max-h-64 space-y-3 overflow-y-auto'>
          {#if Object.keys(cdp.nftCollateralPositions || {}).length > 0}
            {#each Object.entries(cdp.nftCollateralPositions || {}) as [wrapperId, nftPos]}
              <div class='rounded-lg border border-base-300 bg-base-100/50 p-3'>
                <div class='mb-3'>
                  <div class='font-mono text-sm font-medium text-primary'>
                    ID: {wrapperId.slice(-7, -1)}
                  </div>
                </div>
                <div class='space-y-2'>
                  {#each Object.entries((nftPos as any).underlyingPositions || {}) as [resourceAddress, collateral]}
                    <div class='rounded bg-base-200/40 p-2'>
                      <CollateralPositionDisplay
                        {resourceAddress}
                        amount={dec((collateral as any).amount || 0)}
                        usdValue={convertXrdToUsd((collateral as any).value)}
                        fullPrecision={true}
                      />
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          {:else}
            <div class='py-4 text-center text-base-content/60'>No NFT collateral</div>
          {/if}
        </div>
      </div>
    </div>

    <div class='modal-action'>
      <button class='btn' onclick={onClose}>Close</button>
    </div>
  </div>
</div>
