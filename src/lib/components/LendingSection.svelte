<script lang="ts">
  import ListRow from '$lib/components/common/ListRow.svelte';
  import TokenCell from '$lib/components/common/TokenCell.svelte';
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte';
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';

  type LendingPosition = {
    id: string;
    asset: string;
    supplied: string;
    apr: string;
    earned: string;
    price: string;
    change24h: string | number;
    isPositive: boolean;
    logo: string;
  };

  type Pool = {
    id: string;
    asset: string;
    utilization: number;
    supplyApr: string;
    borrowApr: string;
    totalSupply: string;
    totalBorrow: string;
    logo: string;
  };

  const lendingPositions: LendingPosition[] = [
    { id: 'pos1', asset: 'USDC', supplied: '12,500.00', apr: '4.25', earned: '125.50', price: '$1.00', change24h: '+0.02', isPositive: true, logo: '💰' },
    { id: 'pos2', asset: 'ETH', supplied: '2.5', apr: '3.85', earned: '0.045', price: '$2,485.67', change24h: '+3.24', isPositive: true, logo: '⟠' },
    { id: 'pos3', asset: 'WBTC', supplied: '0.25', apr: '2.95', earned: '0.012', price: '$67,234.12', change24h: '-1.85', isPositive: false, logo: '₿' }
  ];

  const availablePools: Pool[] = [
    { id: 'pool1', asset: 'USDT', utilization: 75, supplyApr: '4.12', borrowApr: '6.85', totalSupply: '2.5M', totalBorrow: '1.8M', logo: '💵' },
    { id: 'pool2', asset: 'DAI', utilization: 68, supplyApr: '3.95', borrowApr: '6.22', totalSupply: '1.8M', totalBorrow: '1.2M', logo: '🪙' },
    { id: 'pool3', asset: 'LINK', utilization: 82, supplyApr: '5.25', borrowApr: '8.15', totalSupply: '850K', totalBorrow: '697K', logo: '🔗' },
    { id: 'pool4', asset: 'MATIC', utilization: 45, supplyApr: '6.75', borrowApr: '9.25', totalSupply: '3.2M', totalBorrow: '1.4M', logo: '🔷' }
  ];

  const topPools = $derived(
    [...availablePools]
      .sort((a, b) => parseFloat(b.supplyApr) - parseFloat(a.supplyApr))
      .slice(0, 3)
  );

  function parseUsd(s: string): number {
    return Number.parseFloat(s.replace(/[$,\s]/g, '')) || 0;
  }
</script>

<div class="space-y-6">
  <!-- Your Lending Positions -->
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Your Lending Positions</h2>
 <button class="btn btn-sm btn-outline">Add</button>
      </div>

      <div class="mt-4 space-y-3">
        {#each lendingPositions as position}
          <ListRow>
            {#snippet left()}
              <TokenCell logo={position.logo} symbol={position.asset} price={position.price} change={position.change24h} isPositive={position.isPositive} />
            {/snippet}
            {#snippet right()}
              <div class="flex items-center gap-6">
              <div class="text-right">
                <AmountDisplay amount={position.supplied} symbol={position.asset} usd={parseUsd(position.price) * Number(position.supplied.toString().replace(/[,]/g, ''))} />
              </div>
                <div class="text-right">
                  <div class="text-sm opacity-70">APR</div>
                  <div class="font-medium text-success">{position.apr}%</div>
                </div>

                <div class="flex gap-2">
                  <button class="btn btn-sm btn-outline">Supply</button>
                  <button class="btn btn-sm btn-outline">Withdraw</button>
                </div>
              </div>
            {/snippet}
          </ListRow>
        {/each}
      </div>
    </div>
  </div>

  
</div>
