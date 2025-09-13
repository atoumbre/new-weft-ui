<script lang="ts">
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte';
  import ListRow from '$lib/components/common/ListRow.svelte';
  import TokenCell from '$lib/components/common/TokenCell.svelte';
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';

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

  const marketPools: MarketPool[] = [
    { id: 'pool1', asset: 'USDT', utilization: 75, supplyApr: '4.12', borrowApr: '6.85', priceUsd: 1.001, change24h: '+0.08', isPositive: true, availableLiquidityUnits: 700_000, totalSupplyUnits: 2_500_000, totalBorrowUnits: 1_800_000, logo: '💵' },
    { id: 'pool2', asset: 'DAI',  utilization: 68, supplyApr: '3.95', borrowApr: '6.22', priceUsd: 0.998, change24h: '-0.12', isPositive: false, availableLiquidityUnits: 600_000, totalSupplyUnits: 1_800_000, totalBorrowUnits: 1_200_000, logo: '🪙' },
    { id: 'pool3', asset: 'LINK', utilization: 82, supplyApr: '5.25', borrowApr: '8.15', priceUsd: 15.00, change24h: '+2.15', isPositive: true, availableLiquidityUnits: 150_000, totalSupplyUnits: 850_000, totalBorrowUnits: 697_000, logo: '🔗' },
    { id: 'pool4', asset: 'MATIC',utilization: 45, supplyApr: '6.75', borrowApr: '9.25', priceUsd: 0.90,  change24h: '-4.25', isPositive: false, availableLiquidityUnits: 1_800_000, totalSupplyUnits: 3_200_000, totalBorrowUnits: 1_400_000, logo: '🔷' }
  ];

  type AvailableCollateral = {
    id: string;
    asset: string;
    priceUsd: number;
    change24h: string | number;
    isPositive: boolean;
    ltv: string;
    liquidationLtv: string;
    liquidationPenalty: string;
    totalSuppliedUsd: number;
    logo: string;
  };

  const availableCollaterals: AvailableCollateral[] = [
    { id: 'col1', asset: 'ETH',   priceUsd: 2485.67, change24h: '+3.24', isPositive: true,  ltv: '75%', liquidationLtv: '85%', liquidationPenalty: '10%', totalSuppliedUsd: 45_200_000, logo: '⟠' },
    { id: 'col2', asset: 'WBTC',  priceUsd: 67234.12, change24h: '-1.85', isPositive: false, ltv: '70%', liquidationLtv: '80%', liquidationPenalty: '12%', totalSuppliedUsd: 28_700_000, logo: '₿' },
    { id: 'col3', asset: 'LINK',  priceUsd: 15.0,    change24h: '+2.15', isPositive: true,  ltv: '65%', liquidationLtv: '75%', liquidationPenalty: '10%', totalSuppliedUsd: 12_300_000, logo: '🔗' },
    { id: 'col4', asset: 'MATIC', priceUsd: 0.9,     change24h: '-4.25', isPositive: false, ltv: '60%', liquidationLtv: '70%', liquidationPenalty: '12%', totalSuppliedUsd: 8_900_000, logo: '🔷' }
  ];
</script>

<div class="space-y-6">
  <!-- Available Lending Pools -->
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Available Lending Pools</h2>

      <div class="overflow-x-auto mt-2">
        <table class="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th><div class="tooltip" data-tip="Annualized return to suppliers">Supply APR</div></th>
              <th><div class="tooltip" data-tip="Annualized rate charged to borrowers">Borrow APR</div></th>
              <th><div class="tooltip" data-tip="Borrowed / Supplied">Utilization</div></th>
              <th><div class="tooltip" data-tip="Immediately borrowable liquidity">Available Liquidity</div></th>
              <th>Total Supply</th>
              <th>Total Borrow</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each marketPools as pool}
              <tr>
                <td>
                  <TokenCell logo={pool.logo} symbol={pool.asset} price={`$${pool.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`} change={pool.change24h} isPositive={pool.isPositive} />
                </td>
                <td><span class="font-medium text-success">{pool.supplyApr}%</span></td>
                <td><span class="font-medium text-warning">{pool.borrowApr}%</span></td>
                <td>
                  <UtilizationBar value={pool.utilization} />
                </td>
                <td class="text-sm">
                  <AmountDisplay amount={pool.availableLiquidityUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                </td>
                <td class="text-sm">
                  <AmountDisplay amount={pool.totalSupplyUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                </td>
                <td class="text-sm">
                  <AmountDisplay amount={pool.totalBorrowUnits} symbol={pool.asset} priceUSD={pool.priceUsd} />
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-sm btn-outline">Supply</button>
                    <button class="btn btn-sm btn-outline">Borrow</button>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="8" class="text-center opacity-70">No pools match your filter</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Available Collaterals -->
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3">
        <h2 class="card-title">Available Collaterals</h2>
      </div>
      <div class="overflow-x-auto mt-2">
        <table class="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th><div class="tooltip" data-tip="Max borrowable ratio">LTV</div></th>
              <th><div class="tooltip" data-tip="Ratio at which liquidation occurs">Liquidation LTV</div></th>
              <th><div class="tooltip" data-tip="Discount applied during liquidation">Liquidation Penalty</div></th>
              <th>Total Supplied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each availableCollaterals as collateral}
              <tr>
                <td>
                  <TokenCell
                    logo={collateral.logo}
                    symbol={collateral.asset}
                    price={`$${collateral.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`}
                    change={collateral.change24h}
                    isPositive={collateral.isPositive}
                  />
                </td>
                <td><span class="font-medium">{collateral.ltv}</span></td>
                <td><span class="font-medium">{collateral.liquidationLtv}</span></td>
                <td><span class="font-medium">{collateral.liquidationPenalty}</span></td>
                <td class="text-sm">
                  <AmountDisplay amount={collateral.totalSuppliedUsd / collateral.priceUsd} symbol={collateral.asset} usd={collateral.totalSuppliedUsd} />
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-sm btn-outline">Supply</button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
