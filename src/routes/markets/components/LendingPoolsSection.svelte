<script lang='ts'>
  import type { LoanResource } from '$lib/internal_modules/weft-ledger-state'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { fPercent } from '$lib/utils/common'

  type MarketPool = {
    id: string
    asset: string
    utilization: Decimal
    supplyApr: Decimal
    borrowApr: Decimal
    priceUsd: Decimal
    previousPriceInUSD: Decimal
    isPositive: boolean
    availableLiquidityUnits: Decimal
    totalSupplyUnits: Decimal
    totalBorrowUnits: Decimal
    logo: string | undefined
  }

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()
  const metadataService = getMetadataService()

  function transformPoolData(loanResource: LoanResource): MarketPool {
    const { current: priceInXRD, previous: previousPriceInXRD } = priceStore.getPrice(
      loanResource.resourceAddress,
    )
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
    const previousPriceInUSD = xrdPriceStore.xrdPreviousPrice.mul(previousPriceInXRD)

    const metadata = metadataService.resourceInfoState.get(loanResource?.resourceAddress)?.metadata

    const symbol
      = metadata?.symbol
        || metadata?.name
        || loanResource.resourceAddress.slice(-4)

    const iconUrl = metadata?.iconUrl

    const pool = loanResource.lendingPoolState!
    // Calculate utilization percentage
    const utilization = pool.utilizationRate.mul(100)

    // Calculate available liquidity
    const availableLiquidity = pool.totalDeposit.sub(pool.totalLoan)

    return {
      id: loanResource.resourceAddress,
      asset: symbol,
      utilization,
      supplyApr: pool.netLendingApr,
      borrowApr: pool.borrowingApr,
      priceUsd: priceInUSD,
      previousPriceInUSD,
      isPositive: true,
      availableLiquidityUnits: availableLiquidity,
      totalSupplyUnits: pool.totalDeposit,
      totalBorrowUnits: pool.totalLoan,
      logo: iconUrl,
    }
  }

  // Get market pools from real data, sorted by total deposit USD value descending
  const marketPools: MarketPool[] = $derived(
    marketInfoStore.loanResources
      .map(loanResource => transformPoolData(loanResource))
      .sort((a, b) => b.totalSupplyUnits.mul(b.priceUsd).cmp(a.totalSupplyUnits.mul(a.priceUsd))),
  )
</script>

<!-- <div class='card bg-base-200/60'> -->
<div class='card-body'>
  <div class='flex items-center justify-between'>
    <h2 class='card-title'>Lending Pools</h2>
  </div>

  <div class='mt-2 overflow-x-auto'>
    <table class='table table-sm'>
      <thead class='sticky top-0 bg-base-300/30 backdrop-blur'>
        <tr>
          <th>Asset</th>
          <th><div class='tooltip' data-tip='Annualized return to suppliers'>Supply APR</div></th>
          <th
          ><div class='tooltip' data-tip='Annualized rate charged to borrowers'>
            Borrow APR
          </div></th
          >
          <th><div class='tooltip' data-tip='Borrowed / Supplied'>Utilization</div></th>
          <th>Supplied</th>
          <th>Borrowed</th>
          <th
          ><div class='tooltip' data-tip='Liquidity immediately available for loans'>
            Liquidity
          </div></th
          >
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if marketInfoStore.loading}
          <tr>
            <td colspan='8' class='py-8 text-center'>
              <span class='loading loading-md loading-spinner'></span>
              <span class='ml-2 opacity-70'>Loading lending pools...</span>
            </td>
          </tr>
        {:else if marketPools.length === 0}
          <tr>
            <td colspan='8' class='py-8 text-center opacity-70'>No lending pools available</td>
          </tr>
        {:else}
          {#each marketPools as pool}
            <tr>
              <td>
                <AssetCard
                  symbol={pool.asset}
                  iconUrl={pool.logo}
                  previousPriceUsd={pool.previousPriceInUSD}
                  priceUsd={pool.priceUsd}
                  resourceAddress={pool.id}
                ></AssetCard>
              </td>
              <td><span class='font-medium text-success'>{fPercent(pool.supplyApr)}</span></td>
              <td><span class='font-medium text-warning'>{fPercent(pool.borrowApr)}</span></td>
              <td>
                <UtilizationBar value={pool.utilization} />
              </td>

              <td class='text-sm'>
                <AmountDisplay amount={pool.totalSupplyUnits} priceUSD={pool.priceUsd} />
              </td>
              <td class='text-sm'>
                <AmountDisplay amount={pool.totalBorrowUnits} priceUSD={pool.priceUsd} />
              </td>
              <td class='text-sm'>
                <AmountDisplay amount={pool.availableLiquidityUnits} priceUSD={pool.priceUsd} />
              </td>
              <td>
                <div class='flex gap-2'>
                  <button class='btn btn-outline btn-sm'>Supply</button>
                  <button class='btn btn-outline btn-sm'>Borrow</button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
<!-- </div> -->
