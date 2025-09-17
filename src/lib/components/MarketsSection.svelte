<script lang='ts'>
  import type { CollateralResource, LoanResource } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getResourceInfoStore } from '$lib/stores/price-store.svelte'
  import { getPythPriceStore } from '$lib/stores/pyth-price.svelte'
  import { fPercent, fValue } from '$lib/utils'

  const { showLending = true, showCollaterals = true } = $props()

  type MarketPool = {
    id: string
    asset: string
    utilization: Decimal // 0..100
    supplyApr: Decimal
    borrowApr: Decimal
    priceUsd: Decimal // per-unit USD price
    change24h: string | number
    isPositive: boolean
    availableLiquidityUnits: Decimal
    totalSupplyUnits: Decimal
    totalBorrowUnits: Decimal
    logo: string
  }

  const marketInfoStore = getMarketInfoStore()
  const resourceStore = getResourceInfoStore()
  const pythPriceStore = getPythPriceStore()

  function transformPoolData(loanResource: LoanResource): MarketPool {
    const priceInXRD = resourceStore.getFungibleResourceState(loanResource.resourceAddress)
    const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice)

    // Get token symbol from resource info or default
    const symbol = loanResource?.resourceDetails?.$metadata?.symbol
      || loanResource?.resourceDetails?.$metadata?.name
      || loanResource.resourceAddress.slice(-4)

    const iconUrl = loanResource?.resourceDetails?.$metadata?.iconUrl

    const pool = loanResource.lendingPoolState
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
      change24h: '+0.00%', // TODO: Calculate 24h change when price history is available
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

  // // Calculate totals from real data
  // let totalSuppliedUSD: Decimal = $derived(
  //   marketPools.reduce((sum, pool) => sum.add(pool.totalSupplyUnits.mul(pool.priceUsd)), dec(0))
  // );

  // let totalBorrowedUSD: Decimal = $derived(
  //   marketPools.reduce((sum, pool) => sum.add(pool.totalBorrowUnits.mul(pool.priceUsd)), dec(0))
  // );

  // let totalLiquidityUSD: Decimal = $derived(
  //   marketPools.reduce((sum, pool) => sum.add(pool.availableLiquidityUnits.mul(pool.priceUsd)), dec(0))
  // );

  type AvailableCollateral = {
    id: string
    asset: string
    priceUsd: Decimal
    change24h: string | number
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
    logo: string
  }

  function transformCollateralData(collateralResource: CollateralResource): AvailableCollateral {
    const priceInXRD = resourceStore.getFungibleResourceState(collateralResource.resourceAddress)
    const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice)

    // Get token symbol from resource info or default
    const symbol = collateralResource?.resourceDetails?.$metadata?.symbol
      || collateralResource?.resourceDetails?.$metadata?.name
      || collateralResource.resourceAddress.slice(-4)

    const iconUrl = collateralResource?.resourceDetails?.$metadata?.iconUrl

    // Calculate total supplied USD value using the totalDeposit from CollateralResource
    // const totalSuppliedUnits = ;
    const totalSuppliedDirectUsd = collateralResource.totalDeposit.mul(priceInUSD)
    const totalSuppliedWrappedUsd = collateralResource.totalDepositUnderDU.mul(priceInUSD)

    // Use the correct property path: riskConfig contains the CollateralConfig
    const riskConfig = collateralResource.riskConfig

    const res = {
      id: collateralResource.resourceAddress,
      asset: symbol,
      priceUsd: priceInUSD,
      change24h: '+0.00%', // TODO: Calculate 24h change when price history is available
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
  },
  )
</script>

<div class='space-y-6'>
  <!-- Available Lending Pools -->
  {#if showLending}
    <div class='card bg-base-200/60'>
      <div class='card-body'>
        <div class='flex items-center justify-between flex-wrap gap-4 mb-4'>
          <h2 class='card-title'>Available Lending Pools</h2>

        </div>

        <div class='overflow-x-auto mt-2'>
          <table class='table table-sm'>
            <thead class='bg-base-300/30 backdrop-blur sticky top-0'>
              <tr>
                <th>Asset</th>
                <th><div class='tooltip' data-tip='Annualized return to suppliers'>Supply APR</div></th>
                <th><div class='tooltip' data-tip='Annualized rate charged to borrowers'>Borrow APR</div></th>
                <th><div class='tooltip' data-tip='Borrowed / Supplied'>Utilization</div></th>
                <th>Supplied</th>
                <th>Borrowed</th>
                <th><div class='tooltip' data-tip='Immediately borrowable liquidity'>Liquidity</div></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if marketInfoStore.loading}
                <tr>
                  <td colspan='8' class='text-center py-8'>
                    <span class='loading loading-spinner loading-md'></span>
                    <span class='ml-2 opacity-70'>Loading lending pools...</span>
                  </td>
                </tr>
              {:else if marketPools.length === 0}
                <tr>
                  <td colspan='8' class='text-center opacity-70 py-8'>No lending pools available</td>
                </tr>
              {:else}
                {#each marketPools as pool}
                  <tr>
                    <td>
                      <div class='flex items-center gap-3'>
                        <div class='avatar'>
                          <div class='mask mask-circle w-8 h-8'>
                            {#if pool.logo?.startsWith('http')}
                              <img src={pool.logo} alt={pool.asset} />
                            {:else}
                              <div class='bg-base-300 flex items-center justify-center text-lg'>{pool.logo}</div>
                            {/if}
                          </div>
                        </div>
                        <div>
                          <div class='font-bold'>{pool.asset}</div>
                          <div class='text-sm opacity-50'>{fValue(pool.priceUsd)}</div>
                          <div class="text-xs {pool.isPositive ? 'text-success' : 'text-error'}">{pool.change24h}</div>
                        </div>
                      </div>
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
                    </td>    <td>
                      <div class='flex gap-2'>
                        <button class='btn btn-sm btn-outline'>Supply</button>
                        <button class='btn btn-sm btn-outline'>Borrow</button>
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
  {/if}

  <!-- Available Collaterals -->
  {#if showCollaterals}
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
                <th><div class='tooltip' data-tip='Max borrowable ratio'>LTV</div></th>
                <th><div class='tooltip' data-tip='Ratio at which liquidation occurs'>Liquidation LTV</div></th>
                <th><div class='tooltip' data-tip='Discount applied during liquidation'>Liquidation Penalty</div></th>
                <!-- <th>Total Supplied</th> -->
                <th>Supplied</th>
                <th>Supplied and Lent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if marketInfoStore.loading}
                <tr>
                  <td colspan='6' class='text-center py-8'>
                    <span class='loading loading-spinner loading-md'></span>
                    <span class='ml-2 opacity-70'>Loading collaterals...</span>
                  </td>
                </tr>
              {:else if availableCollaterals.length === 0}
                <tr>
                  <td colspan='6' class='text-center opacity-70 py-8'>No collaterals available</td>
                </tr>
              {:else}
                {#each availableCollaterals as collateral}
                  <tr>
                    <td>
                      <div class='flex items-center gap-3'>
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
                          <div class="text-xs {collateral.isPositive ? 'text-success' : 'text-error'}">{collateral.change24h}</div>
                        </div>
                      </div>
                    </td>
                    <!-- <td>
                    <TokenCell
                      logo={collateral.logo}
                      symbol={collateral.asset}
                      price={`$${collateral.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`}
                      change={collateral.change24h}
                      isPositive={collateral.isPositive}
                    />
                  </td> -->
                    <td><span class='font-medium'>{fPercent(collateral.ltv)}</span></td>
                    <td><span class='font-medium'>{fPercent(collateral.liquidationLtv)}</span></td>
                    <td><span class='font-medium'>{fPercent(collateral.liquidationPenalty)}</span></td>
                    <!-- <td class="text-sm">
                    <AmountDisplay amount={collateral.totalSupplied} usd={collateral.totalSuppliedUsd} />
                  </td> -->
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
  {/if}
</div>
