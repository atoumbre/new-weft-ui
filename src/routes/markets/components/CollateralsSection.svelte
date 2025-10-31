<script lang='ts'>
  import type { CollateralResource } from '$lib/internal_modules/weft-ledger-state'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getMarketResourceStore } from '$lib/stores/market-resource.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fPercent } from '$lib/utils/common'

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
  const marketResource = getMarketResourceStore()
  const metadataService = getMetadataService()

  function transformCollateralData(collateralResource: CollateralResource): AvailableCollateral {
    const { current: priceInXRD, previous: previousPriceInXRD } = priceStore.getPrice(
      collateralResource.resourceAddress,
    )
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
    const previousPriceInUSD = xrdPriceStore.xrdPreviousPrice.mul(previousPriceInXRD)

    // Get token symbol from resource info or default

    // const metadata = collateralResource?.metadata

    const metadata = metadataService.resourceInfoState.get(collateralResource?.resourceAddress)?.metadata

    const symbol
      = metadata?.symbol
        || metadata?.name
        || collateralResource.resourceAddress.slice(-4)

    const iconUrl = metadata?.iconUrl

    const collateralResourceInfo = marketResource.resourceInfo.fungibleResources.find(c => c.resourceAddress === collateralResource.resourceAddress)
    const totalDeposit = collateralResourceInfo?.amount ?? dec(0)
    const duResourceAddress = marketInfoStore.loanResources.find(c => c.resourceAddress === collateralResource.resourceAddress)?.lendingPoolState?.depositUnitAddress
    const totalDepositUnderDU = (duResourceAddress)
      ? marketResource.resourceInfo.fungibleResources.find(c => c.resourceAddress === duResourceAddress)?.amount ?? dec(0)
      : dec(0)

    // Calculate total supplied USD value using the totalDeposit from CollateralResource

    const totalSuppliedDirectUsd = totalDeposit.mul(priceInUSD)
    const totalSuppliedWrappedUsd = totalDepositUnderDU.mul(priceInUSD)

    // Use the correct property path: riskConfig contains the CollateralConfig
    const riskConfig = collateralResource.riskConfig

    const res = {
      id: collateralResource.resourceAddress,
      asset: symbol,
      priceUsd: priceInUSD,
      previousPriceInUSD,
      isPositive: true,
      ltv: riskConfig.loanToValueRatio,
      liquidationLtv: riskConfig.loanToValueRatio.add(riskConfig.liquidationThresholdSpread),
      liquidationPenalty: riskConfig.liquidationBonusRate,
      totalSuppliedDirect: totalDeposit,
      totalSuppliedDirectUsd,
      totalSuppliedWrapped: totalDepositUnderDU,
      totalSuppliedWrappedUsd,
      totalSupplied: totalDeposit.add(totalDepositUnderDU),
      totalSuppliedUsd: totalSuppliedDirectUsd.add(totalSuppliedWrappedUsd),
      logo: iconUrl,
    }

    return res
  }

  // Get collateral data sorted by total supplied USD value descending
  const availableCollaterals: AvailableCollateral[] = $derived.by(() => {
    return marketInfoStore.collateralResources
      .map(collateralResource => transformCollateralData(collateralResource))
      .sort((a, b) => b.totalSuppliedUsd.cmp(a.totalSuppliedUsd))
  })
</script>

<div class='card-body'>
  <div class='flex items-center justify-between'>
    <h2 class='card-title'>Collaterals</h2>
  </div>
  <div class='mt-2 overflow-x-auto'>
    <table class='table table-sm'>
      <thead class='sticky top-0 bg-base-300/30 backdrop-blur'>
        <tr>
          <th>Asset</th>
          <th><div class='tooltip' data-tip='Max allowed borrow ratio'>LTV</div></th>
          <th
          ><div class='tooltip' data-tip='Ratio at which liquidation occurs'>
            Liquidation LTV
          </div></th
          >
          <th
          ><div class='tooltip' data-tip='Discount applied during liquidation'>
            Liquidation Penalty
          </div></th
          >
          <th>Supplied</th>
          <th>Supplied and Lent</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if marketInfoStore.loading}
          <tr>
            <td colspan='7' class='py-8 text-center'>
              <span class='loading loading-md loading-spinner'></span>
              <span class='ml-2 opacity-70'>Loading collaterals...</span>
            </td>
          </tr>
        {:else if availableCollaterals.length === 0}
          <tr>
            <td colspan='7' class='py-8 text-center opacity-70'>No collaterals available</td>
          </tr>
        {:else}
          {#each availableCollaterals as collateral}
            <tr>
              <td>
                <AssetCard
                  symbol={collateral.asset}
                  iconUrl={collateral.logo}
                  previousPriceUsd={collateral.previousPriceInUSD}
                  priceUsd={collateral.priceUsd}
                  resourceAddress={collateral.id}
                ></AssetCard>
              </td>
              <td><span class='font-medium'>{fPercent(collateral.ltv)}</span></td>
              <td><span class='font-medium'>{fPercent(collateral.liquidationLtv)}</span></td>
              <td><span class='font-medium'>{fPercent(collateral.liquidationPenalty)}</span></td>
              <td class='text-sm'>
                <AmountDisplay
                  amount={collateral.totalSuppliedDirect}
                  usd={collateral.totalSuppliedDirectUsd}
                />
              </td>
              <td class='text-sm'>
                <AmountDisplay
                  amount={collateral.totalSuppliedWrapped}
                  usd={collateral.totalSuppliedWrappedUsd}
                />
              </td>
              <td>
                <div class='flex gap-2'>
                  <button class='btn btn-outline btn-sm'>Supply</button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
