<script lang="ts">
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'
  import CDPHealthPill from '$lib/components/common/CDPHealthPill.svelte'
  import { dec, fValue } from '$lib/utils'

  const {
    cdp,
    onClose,
    formatLtv,
    getHealthColor,
    xrdPrice,
  } = $props<{
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
  class="modal modal-open"
  role="dialog"
  aria-labelledby="cdp-modal-title"
  tabindex="-1"
  onclick={onClose}
  onkeydown={e => e.key === 'Escape' && onClose()}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="modal-box max-w-4xl"
    role="document"
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => event.stopPropagation()}
  >
    <div class="flex justify-between items-center mb-4">
      <h3 id="cdp-modal-title" class="font-bold text-lg">CDP Details - {cdp.id}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={onClose}>✕</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <h4 class="font-semibold text-base border-b pb-2">Overview</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="stat bg-base-200/60 rounded-lg p-3">
            <div class="stat-title text-xs">Total Loan</div>
            <div class="stat-value text-lg">{fValue(convertXrdToUsd(cdp.totalLoanValue))}</div>
          </div>
          <div class="stat bg-base-200/60 rounded-lg p-3">
            <div class="stat-title text-xs">Total Collateral</div>
            <div class="stat-value text-lg">{fValue(convertXrdToUsd(cdp.totalCollateralValue))}</div>
          </div>
          <div class="stat bg-base-200/60 rounded-lg p-3">
            <div class="stat-title text-xs">Liquidation LTV</div>
            <div class={`stat-value text-lg ${getHealthColor(cdp.liquidationLtv?.toNumber() || 0)}`}>
              {cdp.liquidationLtv ? formatLtv(cdp.liquidationLtv.toNumber()) : '-'}
            </div>
          </div>
          <div class="stat bg-base-200/60 rounded-lg p-3">
            <div class="stat-title text-xs">Health Factor</div>
            <div class="stat-value text-lg">
              <CDPHealthPill {cdp} />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-semibold text-base border-b pb-2">Loan Positions</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#if Object.keys(cdp.loanPositions || {}).length > 0}
            {#each Object.entries(cdp.loanPositions || {}) as [resourceAddress, loan]}
              <div class="p-3 bg-base-200/60 rounded-lg">
                <CollateralPositionDisplay
                  resourceAddress={resourceAddress}
                  amount={dec((loan as any).amount || 0)}
                  usdValue={convertXrdToUsd((loan as any).value)}
                  fullPrecision={true}
                />
              </div>
            {/each}
          {:else}
            <div class="text-center text-base-content/60 py-4">No loan positions</div>
          {/if}
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-semibold text-base border-b pb-2">Collateral Positions</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#if Object.keys(cdp.collateralPositions || {}).length > 0}
            {#each Object.entries(cdp.collateralPositions || {}) as [resourceAddress, collateral]}
              <div class="p-3 bg-base-200/60 rounded-lg">
                <CollateralPositionDisplay
                  resourceAddress={resourceAddress}
                  amount={dec((collateral as any).amount || 0)}
                  usdValue={convertXrdToUsd((collateral as any).value)}
                  fullPrecision={true}
                />
              </div>
            {/each}
          {:else}
            <div class="text-center text-base-content/60 py-4">No collateral positions</div>
          {/if}
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-semibold text-base border-b pb-2">NFT Collateral</h4>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          {#if Object.keys(cdp.nftCollateralPositions || {}).length > 0}
            {#each Object.entries(cdp.nftCollateralPositions || {}) as [wrapperId, nftPos]}
              <div class="border border-base-300 rounded-lg p-3 bg-base-100/50">
                <div class="mb-3">
                  <div class="font-mono text-sm font-medium text-primary">
                    ID: {wrapperId.slice(-7, -1)}
                  </div>
                </div>
                <div class="space-y-2">
                  {#each Object.entries((nftPos as any).underlyingPositions || {}) as [resourceAddress, collateral]}
                    <div class="p-2 bg-base-200/40 rounded">
                      <CollateralPositionDisplay
                        resourceAddress={resourceAddress}
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
            <div class="text-center text-base-content/60 py-4">No NFT collateral</div>
          {/if}
        </div>
      </div>
    </div>

    <div class="modal-action">
      <button class="btn" onclick={onClose}>Close</button>
    </div>
  </div>
</div>
