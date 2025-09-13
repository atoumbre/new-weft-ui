<script>
  const lendingPositions = [
    { id: 'pos1', asset: 'USDC', supplied: '12,500.00', apr: '4.25', earned: '125.50', price: '$1.00', change24h: '+0.02', isPositive: true, logo: '💰' },
    { id: 'pos2', asset: 'ETH', supplied: '2.5', apr: '3.85', earned: '0.045', price: '$2,485.67', change24h: '+3.24', isPositive: true, logo: '⟠' },
    { id: 'pos3', asset: 'WBTC', supplied: '0.25', apr: '2.95', earned: '0.012', price: '$67,234.12', change24h: '-1.85', isPositive: false, logo: '₿' }
  ];

  const availablePools = [
    { id: 'pool1', asset: 'USDT', utilization: 75, supplyApr: '4.12', borrowApr: '6.85', totalSupply: '2.5M', totalBorrow: '1.8M', logo: '💵' },
    { id: 'pool2', asset: 'DAI', utilization: 68, supplyApr: '3.95', borrowApr: '6.22', totalSupply: '1.8M', totalBorrow: '1.2M', logo: '🪙' },
    { id: 'pool3', asset: 'LINK', utilization: 82, supplyApr: '5.25', borrowApr: '8.15', totalSupply: '850K', totalBorrow: '697K', logo: '🔗' },
    { id: 'pool4', asset: 'MATIC', utilization: 45, supplyApr: '6.75', borrowApr: '9.25', totalSupply: '3.2M', totalBorrow: '1.4M', logo: '🔷' }
  ];
</script>

<div class="space-y-6">
  <!-- Your Lending Positions -->
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Your Lending Positions</h2>
        <div class="badge badge-outline">{lendingPositions.length} Active</div>
      </div>

      <div class="mt-4 space-y-3">
        {#each lendingPositions as position}
          <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
            <div class="flex items-center gap-4">
              <div class="text-2xl">{position.logo}</div>
              <div>
                <div class="font-medium">{position.asset}</div>
                <div class="text-sm opacity-70 flex items-center gap-2">
                  <span>{position.price}</span>
                  <div class="flex items-center gap-1" class:text-success={position.isPositive} class:text-error={!position.isPositive}>
                    {#if position.isPositive}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
                    {/if}
                    <span>{position.change24h}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-right">
                <div class="text-sm opacity-70">Supplied</div>
                <div class="font-medium">{position.supplied} {position.asset}</div>
              </div>
              <div class="text-right">
                <div class="text-sm opacity-70">APR</div>
                <div class="font-medium text-success">{position.apr}%</div>
              </div>
              <div class="text-right">
                <div class="text-sm opacity-70">Earned</div>
                <div class="font-medium">{position.earned} {position.asset}</div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-outline">Supply</button>
                <button class="btn btn-sm btn-outline">Withdraw</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Available Lending Pools -->
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Available Lending Pools</h2>

      <div class="overflow-x-auto mt-2">
        <table class="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Supply APR</th>
              <th>Borrow APR</th>
              <th>Utilization</th>
              <th>Total Supply</th>
              <th>Total Borrow</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each availablePools as pool}
              <tr>
                <td>
                  <div class="flex items-center gap-2"><span class="text-lg">{pool.logo}</span><span class="font-medium">{pool.asset}</span></div>
                </td>
                <td><span class="font-medium text-success">{pool.supplyApr}%</span></td>
                <td><span class="font-medium text-warning">{pool.borrowApr}%</span></td>
                <td>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-sm"><span>{pool.utilization}%</span></div>
                    <progress class="progress progress-primary h-2" max="100" value={pool.utilization}></progress>
                  </div>
                </td>
                <td class="text-sm">{pool.totalSupply}</td>
                <td class="text-sm">{pool.totalBorrow}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-sm">Supply</button>
                    <button class="btn btn-sm btn-outline" aria-label="View">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">Top Performing Pools</h2>
        <div class="mt-2 space-y-3">
          {#each [...availablePools].sort((a, b) => parseFloat(b.supplyApr) - parseFloat(a.supplyApr)).slice(0, 3) as pool}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>{pool.logo}</span>
                <span class="font-medium">{pool.asset}</span>
              </div>
              <div class="flex items-center gap-2 text-success">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                <span class="font-medium">{pool.supplyApr}%</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">Market Overview</h2>
        <div class="mt-2 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm opacity-70">Total Value Locked</span>
            <span class="font-medium">$8.35M</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm opacity-70">Average Supply APR</span>
            <span class="font-medium text-success">4.77%</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm opacity-70">Average Utilization</span>
            <span class="font-medium">67.5%</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm opacity-70">Active Pools</span>
            <span class="font-medium">{availablePools.length}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
