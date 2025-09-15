<script lang="ts">
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte';
  import TokenCell from '$lib/components/common/TokenCell.svelte';
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';
  import { getResourceInfoStore } from '$lib/stores/resource-data-store.svelte';
  import { getPythPriceStore } from '$lib/stores/pyth-price.svelte';
  import { dec, fValue, fPercent } from '$lib/utils';
  import type { CollateralResource, ReturnedResourcePoolState } from '$lib/internal_modules/dist';
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte';

  type MarketPool = {
    id: string;
    asset: string;
    utilization: number;
    supplyApr: string;
    borrowApr: string;
    priceUsd: number;
    change24h: string | number;
    isPositive: boolean;
    availableLiquidityUnits: number;
    totalSupplyUnits: number;
    totalBorrowUnits: number;
    logo: string;
  };

  const marketInfoStore = getMarketInfoStore();
  const resourceStore = getResourceInfoStore();
  const pythPriceStore = getPythPriceStore();

  function transformPoolData(pool: ReturnedResourcePoolState): MarketPool {
    const resourceInfo = resourceStore.getFungibleResourceState(pool.resourceAddress);
    const priceInXRD = resourceInfo?.price?.toNumber() || 0;
    const priceInUSD = priceInXRD * pythPriceStore.xrdPrice.toNumber();

    // Calculate utilization percentage
    const utilization = pool.utilizationRate.mul(100).toNumber();

    // Calculate available liquidity
    const availableLiquidity = pool.totalDeposit.sub(pool.totalLoan).toNumber();

    // Get token symbol from resource info or default
    const symbol = resourceInfo?.resourceState?.$metadata?.symbol ||
                   resourceInfo?.resourceState?.$metadata?.name ||
                   pool.resourceAddress.slice(-4);


    const iconUrl = resourceInfo?.resourceState?.$metadata?.iconUrl;

    return {
      id: pool.resourceAddress,
      asset: symbol,
      utilization: Math.round(utilization),
      supplyApr: fPercent(pool.netLendingApr),
      borrowApr: fPercent(pool.borrowingApr),
      priceUsd: priceInUSD,
      change24h: '+0.00%', // TODO: Calculate 24h change when price history is available
      isPositive: true,
      availableLiquidityUnits: availableLiquidity,
      totalSupplyUnits: pool.totalDeposit.toNumber(),
      totalBorrowUnits: pool.totalLoan.toNumber(),
      logo: iconUrl 
    };
  }



  // Get market pools from real data, sorted by total deposit USD value descending
  let marketPools: MarketPool[] = $derived(
   marketInfoStore.loanResources
          .map((loanResource) => transformPoolData(loanResource.lendingPoolState))
          .sort((a, b) => (b.totalSupplyUnits * b.priceUsd) - (a.totalSupplyUnits * a.priceUsd))

  );

  // Calculate totals from real data
  let totalSuppliedUSD = $derived(
    marketPools.reduce((sum, pool) => sum + (pool.totalSupplyUnits * pool.priceUsd), 0)
  );

  let totalBorrowedUSD = $derived(
    marketPools.reduce((sum, pool) => sum + (pool.totalBorrowUnits * pool.priceUsd), 0)
  );

  let totalLiquidityUSD = $derived(
    marketPools.reduce((sum, pool) => sum + (pool.availableLiquidityUnits * pool.priceUsd), 0)
  );

  type AvailableCollateral = {
    id: string;
    asset: string;
    priceUsd: number;
    change24h: string | number;
    isPositive: boolean;
    ltv: string;
    liquidationLtv: string;
    liquidationPenalty: string;
    totalSupplied: number;
    totalSuppliedUsd: number;
    logo: string;
  };

  function transformCollateralData(collateralResource: CollateralResource): AvailableCollateral {
    const resourceInfo = resourceStore.getFungibleResourceState(collateralResource.resourceAddress);
    const priceInXRD = resourceInfo?.price?.toNumber() || 0;
    const priceInUSD = priceInXRD * pythPriceStore.xrdPrice.toNumber();

    // Get token symbol from resource info or default
    const symbol = resourceInfo?.resourceState?.$metadata?.symbol ||
                   resourceInfo?.resourceState?.$metadata?.name ||
                   collateralResource.resourceAddress.slice(-4);

    const iconUrl = resourceInfo?.resourceState?.$metadata?.iconUrl;

    // Calculate total supplied USD value using the totalDeposit from CollateralResource
    const totalSuppliedUnits = collateralResource.totalDeposit?.toNumber() ;
    const totalSuppliedUsd = totalSuppliedUnits * priceInUSD;

    // Use the correct property path: riskConfig contains the CollateralConfig
    const riskConfig = collateralResource.riskConfig ;

    let res = {
      id: collateralResource.resourceAddress,
      asset: symbol,
      priceUsd: priceInUSD,
      change24h: '+0.00%', // TODO: Calculate 24h change when price history is available
      isPositive: true,
      ltv: fPercent(riskConfig.loanToValueRatio),
      liquidationLtv: fPercent(riskConfig.loanToValueRatio.add(riskConfig.liquidationThresholdSpread)),
      liquidationPenalty: fPercent(riskConfig.liquidationBonusRate ),
      totalSupplied: collateralResource.totalDeposit.toNumber(),
      totalSuppliedUsd: totalSuppliedUsd,
      logo: iconUrl 
    }


    return res;
  }

  // Get collateral data from real data, sorted by total supplied USD value descending
  let availableCollaterals: AvailableCollateral[] = $derived(
    marketInfoStore.collateralResources
      .map((collateralResource) => transformCollateralData(collateralResource))
      .sort((a, b) => b.totalSuppliedUsd - a.totalSuppliedUsd)
  );
</script>

<div class="space-y-6">
  <!-- Available Lending Pools -->
  <div class="card bg-base-200/60">
    <div class="card-body">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 class="card-title">Available Lending Pools</h2>

      </div>

      <div class="overflow-x-auto mt-2">
        <table class="table table-sm">
          <thead class="bg-base-300/30 backdrop-blur sticky top-0">
            <tr>
              <th>Asset</th>
              <th><div class="tooltip" data-tip="Annualized return to suppliers">Supply APR</div></th>
              <th><div class="tooltip" data-tip="Annualized rate charged to borrowers">Borrow APR</div></th>
              <th><div class="tooltip" data-tip="Borrowed / Supplied">Utilization</div></th>
              <th>Supplied</th>
              <th>Borrowed</th>
              <th><div class="tooltip" data-tip="Immediately borrowable liquidity">Liquidity</div></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#if marketInfoStore.loading}
              <tr>
                <td colspan="8" class="text-center py-8">
                  <span class="loading loading-spinner loading-md"></span>
                  <span class="ml-2 opacity-70">Loading lending pools...</span>
                </td>
              </tr>
            {:else if marketPools.length === 0}
              <tr>
                <td colspan="8" class="text-center opacity-70 py-8">No lending pools available</td>
              </tr>
            {:else}
              {#each marketPools as pool}
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-circle w-8 h-8">
                          {#if  pool.logo?.startsWith('http')}
                            <img src={pool.logo} alt={pool.asset} />
                          {:else}
                            <div class="bg-base-300 flex items-center justify-center text-lg">{pool.logo}</div>
                          {/if}
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{pool.asset}</div>
                        <div class="text-sm opacity-50">{fValue(dec(pool.priceUsd))}</div>
                        <div class="text-xs {pool.isPositive ? 'text-success' : 'text-error'}">{pool.change24h}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="font-medium text-success">{pool.supplyApr}</span></td>
                  <td><span class="font-medium text-warning">{pool.borrowApr}</span></td>
                  <td>
                    <UtilizationBar value={pool.utilization} />
                  </td>
    
                  <td class="text-sm">
                    <AmountDisplay amount={pool.totalSupplyUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                  </td>
                  <td class="text-sm">
                    <AmountDisplay amount={pool.totalBorrowUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                  </td>
                            <td class="text-sm">
                    <AmountDisplay amount={pool.availableLiquidityUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                  </td>    <td>
                    <div class="flex gap-2">
                      <button class="btn btn-sm btn-outline">Supply</button>
                      <button class="btn btn-sm btn-outline">Borrow</button>
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

  <!-- Available Collaterals -->
  <div class="card bg-base-200/60">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3">
        <h2 class="card-title">Available Collaterals</h2>
      </div>
      <div class="overflow-x-auto mt-2">
        <table class="table table-sm">
          <thead class="bg-base-300/30 backdrop-blur sticky top-0">
            <tr>
              <th>Asset</th>
              <th><div class="tooltip" data-tip="Max borrowable ratio">LTV</div></th>
              <th><div class="tooltip" data-tip="Ratio at which liquidation occurs">Liquidation LTV</div></th>
              <th><div class="tooltip" data-tip="Discount applied during liquidation">Liquidation Penalty</div></th>
              <th>Supplied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#if marketInfoStore.loading}
              <tr>
                <td colspan="6" class="text-center py-8">
                  <span class="loading loading-spinner loading-md"></span>
                  <span class="ml-2 opacity-70">Loading collaterals...</span>
                </td>
              </tr>
            {:else if availableCollaterals.length === 0}
              <tr>
                <td colspan="6" class="text-center opacity-70 py-8">No collaterals available</td>
              </tr>
            {:else}
              {#each availableCollaterals as collateral}
                <tr>
                       <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-circle w-8 h-8">
                          {#if  collateral.logo?.startsWith('http')}
                            <img src={collateral.logo} alt={collateral.asset} />
                          {:else}
                            <div class="bg-base-300 flex items-center justify-center text-lg">{collateral.logo}</div>
                          {/if}
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{collateral.asset}</div>
                        <div class="text-sm opacity-50">{fValue(dec(collateral.priceUsd))}</div>
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
                  <td><span class="font-medium">{collateral.ltv}</span></td>
                  <td><span class="font-medium">{collateral.liquidationLtv}</span></td>
                  <td><span class="font-medium">{collateral.liquidationPenalty}</span></td>
                  <td class="text-sm">
                    <AmountDisplay amount={collateral.totalSupplied} symbol={collateral.asset} usd={collateral.totalSuppliedUsd} />
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-sm btn-outline">Supply</button>
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
</div>
