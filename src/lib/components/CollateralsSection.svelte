<script lang='ts'>
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';
  import type { CollateralResource } from '$lib/internal_modules/dist';
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte';
  import { getPriceStore } from '$lib/stores/price-store.svelte';
  import { fPercent } from '$lib/utils';
  import type Decimal from 'decimal.js';
  import AssetCard from './common/AssetCard.svelte';
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte';

  type AvailableCollateral = {
    id: string
    asset: string
    priceUsd: Decimal
    previousPriceInUSD: Decimal
    isPositive: boolean
    ltv: Decimal
    liquidationLtv: Decimal
    liquidationPenalty: Decimal
    totalSupplied: Decimal
    totalSuppliedUsd: Decimal
    totalSuppliedDirect: Decimal
    totalSuppliedDirectUsd: Decimal
    totalSuppliedWrapped: Decimal
    totalSuppliedWrappedUsd: Decimal
    logo: string | undefined
  }

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

  function transformCollateralData(collateralResource: CollateralResource): AvailableCollateral {
    const {current:priceInXRD,previous:previousPriceInXRD } = priceStore.getPrice(collateralResource.resourceAddress)
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
    const previousPriceInUSD = xrdPriceStore.xrdPreviousPrice.mul(previousPriceInXRD)
    
    // Get token symbol from resource info or default
    const symbol = collateralResource?.resourceDetails?.$metadata?.symbol
      || collateralResource?.resourceDetails?.$metadata?.name
      || collateralResource.resourceAddress.slice(-4)

    const iconUrl = collateralResource?.resourceDetails?.$metadata?.iconUrl

    // Calculate total supplied USD value using the totalDeposit from CollateralResource
    const totalSuppliedDirectUsd = collateralResource.totalDeposit.mul(priceInUSD)
    const totalSuppliedWrappedUsd = collateralResource.totalDepositUnderDU.mul(priceInUSD)

    // Use the correct property path: riskConfig contains the CollateralConfig
    const riskConfig = collateralResource.riskConfig

    const res = {
      id: collateralResource.resourceAddress,
      asset: symbol,
      priceUsd: priceInUSD,
      previousPriceInUSD: previousPriceInUSD,
      isPositive: true,
      ltv: riskConfig.loanToValueRatio,
      liquidationLtv: riskConfig.loanToValueRatio.add(riskConfig.liquidationThresholdSpread),
      liquidationPenalty: riskConfig.liquidationBonusRate,
      totalSuppliedDirect: collateralResource.totalDeposit,
      totalSuppliedDirectUsd,
      totalSuppliedWrapped: collateralResource.totalDepositUnderDU,
      totalSuppliedWrappedUsd,
      totalSupplied: collateralResource.totalDeposit.add(collateralResource.totalDepositUnderDU),
      totalSuppliedUsd: totalSuppliedDirectUsd.add(totalSuppliedWrappedUsd),
      logo: iconUrl,
    }

    return res
  }

  // Get collateral data from real data, sorted by total supplied USD value descending
  const availableCollaterals: AvailableCollateral[] = $derived.by(() => {
    return marketInfoStore.collateralResources
      .map(collateralResource => transformCollateralData(collateralResource))
      .sort((a, b) => b.totalSuppliedUsd.cmp(a.totalSuppliedUsd))
  })
</script>

<div class='card bg-base-200/60'>
  <div class='card-body'>
    <div class='flex items-center justify-between gap-3'>
      <h2 class='card-title'>Available Collaterals</h2>
    </div>
    <div class='overflow-x-auto mt-2'>
      <table class='table table-sm'>
        <thead class='bg-base-300/30 backdrop-blur sticky top-0'>
          <tr>
            <th>Asset</th>
            <th><div class='tooltip' data-tip='Max allowed borrow ratio'>LTV</div></th>
            <th><div class='tooltip' data-tip='Ratio at which liquidation occurs'>Liquidation LTV</div></th>
            <th><div class='tooltip' data-tip='Discount applied during liquidation'>Liquidation Penalty</div></th>
            <th>Supplied</th>
            <th>Supplied and Lent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if marketInfoStore.loading}
            <tr>
              <td colspan='7' class='text-center py-8'>
                <span class='loading loading-spinner loading-md'></span>
                <span class='ml-2 opacity-70'>Loading collaterals...</span>
              </td>
            </tr>
          {:else if availableCollaterals.length === 0}
            <tr>
              <td colspan='7' class='text-center opacity-70 py-8'>No collaterals available</td>
            </tr>
          {:else}
            {#each availableCollaterals as collateral}
              <tr>
                <td>
                  <!-- <div class='flex items-center gap-3'>
                    <div class='avatar'>
                      <div class='mask mask-circle w-8 h-8'>
                        {#if collateral.logo?.startsWith('http')}
                          <img src={collateral.logo} alt={collateral.asset} />
                        {:else}
                          <div class='bg-base-300 flex items-center justify-center text-lg'>{collateral.logo}</div>
                        {/if}
                      </div>
                    </div>
                    <div>
                      <div class='font-bold'>{collateral.asset}</div>
                      <div class='text-sm opacity-50'>{fValue(collateral.priceUsd)}</div>
                      <div class="text-xs {collateral.isPositive ? 'text-success' : 'text-error'}">{collateral.previousPriceInUSD}</div>
                    </div>
                  </div> -->

        <AssetCard symbol={collateral.asset} iconUrl={collateral.logo} previousPriceUsd={collateral.previousPriceInUSD} priceUsd={collateral.priceUsd} resourceAddress={collateral.id}></AssetCard>
                </td>
                <td><span class='font-medium'>{fPercent(collateral.ltv)}</span></td>
                <td><span class='font-medium'>{fPercent(collateral.liquidationLtv)}</span></td>
                <td><span class='font-medium'>{fPercent(collateral.liquidationPenalty)}</span></td>
                <td class='text-sm'>
                  <AmountDisplay amount={collateral.totalSuppliedDirect} usd={collateral.totalSuppliedDirectUsd} />
                </td>
                <td class='text-sm'>
                  <AmountDisplay amount={collateral.totalSuppliedWrapped} usd={collateral.totalSuppliedWrappedUsd} />
                </td>
                <td>
                  <div class='flex gap-2'>
                    <button class='btn btn-sm btn-outline'>Supply</button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
