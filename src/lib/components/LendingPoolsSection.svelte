<script lang="ts">
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte';
  import type { LoanResource } from '$lib/internal_modules/dist';
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte';
  import { getPythPriceStore } from '$lib/stores/pyth-price.svelte';
  import { getResourceInfoStore } from '$lib/stores/price-store.svelte';
  import { fPercent, fValue } from '$lib/utils';
  import type Decimal from 'decimal.js';

  type MarketPool = {
    id: string;
    asset: string;
    utilization: Decimal; // 0..100
    supplyApr: Decimal;
    borrowApr: Decimal;
    priceUsd: Decimal; // per-unit USD price
    change24h: string | number;
    isPositive: boolean;
    availableLiquidityUnits: Decimal;
    totalSupplyUnits: Decimal;
    totalBorrowUnits: Decimal;
    logo: string;
  };

  const marketInfoStore = getMarketInfoStore();
  const resourceStore = getResourceInfoStore();
  const pythPriceStore = getPythPriceStore();

  function transformPoolData(loanResource: LoanResource): MarketPool {
    const priceInXRD = resourceStore.getFungibleResourceState(loanResource.resourceAddress) ;
    const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice);

    // Get token symbol from resource info or default
    const symbol = loanResource?.resourceDetails?.$metadata?.symbol ||
                   loanResource?.resourceDetails?.$metadata?.name ||
                   loanResource.resourceAddress.slice(-4);

    const iconUrl = loanResource?.resourceDetails?.$metadata?.iconUrl;

    const pool =  loanResource.lendingPoolState;
    // Calculate utilization percentage
    const utilization =pool.utilizationRate.mul(100);

    // Calculate available liquidity
    const availableLiquidity =pool.totalDeposit.sub(pool.totalLoan);

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
      logo: iconUrl
    };
  }

  // Get market pools from real data, sorted by total deposit USD value descending
  let marketPools: MarketPool[] = $derived(
    marketInfoStore.loanResources
      .map((loanResource) => transformPoolData(loanResource))
      .sort((a, b) => b.totalSupplyUnits.mul(b.priceUsd).cmp(a.totalSupplyUnits.mul(a.priceUsd)))
  );
</script>

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
                      <div class="text-sm opacity-50">{fValue(pool.priceUsd)}</div>
                      <div class="text-xs {pool.isPositive ? 'text-success' : 'text-error'}">{pool.change24h}</div>
                    </div>
                  </div>
                </td>
                <td><span class="font-medium text-success">{fPercent(pool.supplyApr)}</span></td>
                <td><span class="font-medium text-warning">{fPercent(pool.borrowApr)}</span></td>
                <td>
                  <UtilizationBar value={pool.utilization} />
                </td>

                <td class="text-sm">
                  <AmountDisplay amount={pool.totalSupplyUnits}  priceUSD={pool.priceUsd} />
                </td>
                <td class="text-sm">
                  <AmountDisplay amount={pool.totalBorrowUnits}  priceUSD={pool.priceUsd} />
                </td>
                        <td class="text-sm">
                  <AmountDisplay amount={pool.availableLiquidityUnits}  priceUSD={pool.priceUsd} />
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