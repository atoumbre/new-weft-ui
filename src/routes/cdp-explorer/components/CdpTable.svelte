<script lang="ts">
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import type { XRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'
  import CDPHealthPill from '$lib/components/common/CDPHealthPill.svelte'
  import { dec, fValue } from '$lib/utils'

  const {
    cdps = [],
    formatLtv,
    getHealthColor,
    xrdPriceStore,
    onSelectCdp,
  } = $props<{
    cdps?: CollateralizeDebtPositionData[]
    formatLtv: (ltv: number) => string
    getHealthColor: (ltv: number | Decimal) => string
    xrdPriceStore: XRDPriceStore
    onSelectCdp: (cdp: CollateralizeDebtPositionData) => void
  }>()

  const xrdPrice = $derived(xrdPriceStore.xrdPrice)

  const convertXrdToUsd = (value: Decimal | undefined | null) => {
    if (!value)
      return dec(0)
    return value.mul(xrdPrice)
  }

  function getFungibleCollateralInfo(cdp: CollateralizeDebtPositionData) {
    const positions = Object.entries(cdp.collateralPositions || {})
    return positions.reduce(
      (acc, [, collateral]) => {
        return {
          count: acc.count + 1,
          totalValue: acc.totalValue.add(convertXrdToUsd(collateral.value)),
        }
      },
      { count: 0, totalValue: dec(0) },
    )
  }

  function getNftCollateralInfo(cdp: CollateralizeDebtPositionData) {
    const nftPositions = Object.values(cdp.nftCollateralPositions || {}) as any[]
    return nftPositions.reduce(
      (acc, nftPos) => {
        const underlying = Object.values(nftPos?.underlyingPositions || {}) as any[]
        const totalValue = underlying.reduce((sum, collateral) => sum.add(convertXrdToUsd(collateral?.value)), dec(0))
        return {
          wrapperCount: acc.wrapperCount + 1,
          totalValue: acc.totalValue.add(totalValue),
        }
      },
      { wrapperCount: 0, totalValue: dec(0) },
    )
  }

  const tableData = $derived.by(() => cdps.map((cdp: CollateralizeDebtPositionData) => {
    const loanEntries = Object.entries(cdp.loanPositions || {})
    return {
      cdp,
      collateralInfo: getFungibleCollateralInfo(cdp),
      nftInfo: getNftCollateralInfo(cdp),
      loanPreview: loanEntries.slice(0, 2),
      totalLoanPositions: loanEntries.length,
    }
  }))
</script>

<div class="card bg-base-200/60">
  <div class="card-body p-0">
    <div class="overflow-x-auto">
      <table class="table table-zebra table-sm">
        <thead>
          <tr class="border-base-300">
            <th class="text-left">CDP</th>
            <th class="text-center">LIQ. LTV</th>
            <th class="text-right">TOT. LOAN</th>
            <th class="text-right">TOT. COLL.</th>
            <th class="text-center">HEALTH</th>
            <th class="text-left">LOAN POSITIONS</th>
            <th class="text-right">COLL. VALUE</th>
            <th class="text-right">NFT VALUE</th>
          </tr>
        </thead>
        <tbody>
          {#each tableData as { cdp, collateralInfo, nftInfo, loanPreview, totalLoanPositions }}
            <tr
              class="hover:bg-base-300/50 cursor-pointer"
              onclick={() => onSelectCdp(cdp)}
              onkeydown={e => (e.key === 'Enter' || e.key === ' ') && onSelectCdp(cdp)}
              tabindex="0"
              role="button"
              aria-label={`View CDP ${cdp.id} details`}
            >
              <td class="font-mono font-medium">
                <span class="text-primary">{cdp.id || 'N/A'}</span>
              </td>

              <td class="text-center">
                <span class={`font-medium ${getHealthColor(cdp.liquidationLtv ?? 0)}`}>
                  {cdp.liquidationLtv ? formatLtv(cdp.liquidationLtv.toNumber()) : '-'}
                </span>
              </td>

              <td class="text-right font-medium">
                {fValue(convertXrdToUsd(cdp.totalLoanValue), { fullPrecision: false })}
              </td>

              <td class="text-right font-medium">
                {fValue(convertXrdToUsd(cdp.totalCollateralValue), { fullPrecision: false })}
              </td>

              <td class="text-center">
                <CDPHealthPill {cdp} />
              </td>

              <td>
                <div class="space-y-1">
                  {#if totalLoanPositions > 0}
                    {#each loanPreview as [resourceAddress, loan]}
                      <CollateralPositionDisplay
                        resourceAddress={resourceAddress}
                        amount={dec((loan as any).amount || 0)}
                        usdValue={convertXrdToUsd((loan as any).value as Decimal | undefined)}
                      />
                    {/each}
                    {#if totalLoanPositions > 2}
                      <div class="text-xs text-base-content/60">
                        +{totalLoanPositions - 2} more
                      </div>
                    {/if}
                  {:else}
                    <span class="text-base-content/60">No loans</span>
                  {/if}
                </div>
              </td>

              <td class="text-right">
                <div class="flex flex-col items-end">
                  <span class="font-medium">{fValue(collateralInfo.totalValue, { fullPrecision: false })}</span>
                  <span class="text-xs text-base-content/60">{collateralInfo.count} position{collateralInfo.count !== 1 ? 's' : ''}</span>
                </div>
              </td>

              <td class="text-right">
                <div class="flex flex-col items-end">
                  <span class="font-medium">{fValue(nftInfo.totalValue, { fullPrecision: false })}</span>
                  <span class="text-xs text-base-content/60">{nftInfo.wrapperCount} wrapper{nftInfo.wrapperCount !== 1 ? 's' : ''}</span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
