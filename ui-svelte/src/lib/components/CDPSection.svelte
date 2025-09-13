<script>
  const cdpPositions = [
    { id: 'CDP-001', collaterals: [ { asset: 'ETH', amount: '5.0', value: '$12,500', price: '$2,485.67', change24h: '+3.24', isPositive: true, logo: '⟠' }, { asset: 'WBTC', amount: '0.15', value: '$6,750', price: '$67,234.12', change24h: '-1.85', isPositive: false, logo: '₿' } ], loans: [ { asset: 'USDC', borrowed: '8,500', interestRate: '5.25', price: '$1.00', change24h: '+0.02', isPositive: true, logo: '💰' }, { asset: 'DAI', borrowed: '2,000', interestRate: '4.85', price: '$0.998', change24h: '-0.12', isPositive: false, logo: '🪙' } ], healthRatio: 2.1, totalCollateral: '$19,250', totalDebt: '$10,500', liquidationPrice: '$1,890', status: 'healthy' },
    { id: 'CDP-002', collaterals: [ { asset: 'LINK', amount: '1,200', value: '$18,000', price: '$15.00', change24h: '+2.15', isPositive: true, logo: '🔗' } ], loans: [ { asset: 'USDT', borrowed: '12,000', interestRate: '6.15', price: '$1.001', change24h: '+0.08', isPositive: true, logo: '💵' } ], healthRatio: 1.45, totalCollateral: '$18,000', totalDebt: '$12,000', liquidationPrice: '$12.50', status: 'warning' },
    { id: 'CDP-003', collaterals: [ { asset: 'MATIC', amount: '15,000', value: '$13,500', price: '$0.90', change24h: '-4.25', isPositive: false, logo: '🔷' } ], loans: [ { asset: 'DAI', borrowed: '7,200', interestRate: '4.95', price: '$0.998', change24h: '-0.12', isPositive: false, logo: '🪙' } ], healthRatio: 1.85, totalCollateral: '$13,500', totalDebt: '$7,200', liquidationPrice: '$0.65', status: 'healthy' }
  ];

  const availableCollaterals = [
    { id: 'col1', asset: 'ETH', price: '$2,485.67', change24h: '+3.24', isPositive: true, ltv: '75%', totalSupplied: '$45.2M', logo: '⟠' },
    { id: 'col2', asset: 'WBTC', price: '$67,234.12', change24h: '-1.85', isPositive: false, ltv: '70%', totalSupplied: '$28.7M', logo: '₿' },
    { id: 'col3', asset: 'LINK', price: '$15.00', change24h: '+2.15', isPositive: true, ltv: '65%', totalSupplied: '$12.3M', logo: '🔗' },
    { id: 'col4', asset: 'MATIC', price: '$0.90', change24h: '-4.25', isPositive: false, ltv: '60%', totalSupplied: '$8.9M', logo: '🔷' }
  ];

  const availableLoanResources = [
    { id: 'loan1', asset: 'USDC', price: '$1.00', change24h: '+0.02', isPositive: true, borrowApr: '5.25%', availableLiquidity: '$2.5M', logo: '💰' },
    { id: 'loan2', asset: 'USDT', price: '$1.001', change24h: '+0.08', isPositive: true, borrowApr: '6.15%', availableLiquidity: '$1.8M', logo: '💵' },
    { id: 'loan3', asset: 'DAI', price: '$0.998', change24h: '-0.12', isPositive: false, borrowApr: '4.85%', availableLiquidity: '$2.2M', logo: '🪙' },
    { id: 'loan4', asset: 'FRAX', price: '$1.002', change24h: '+0.15', isPositive: true, borrowApr: '4.95%', availableLiquidity: '$1.1M', logo: '🏛️' }
  ];

  let selectedCDP = 'CDP-001';
  $: currentCDP = cdpPositions.find((c) => c.id === selectedCDP);

  function healthColor(ratio) {
    if (ratio >= 2.0) return 'text-success';
    if (ratio >= 1.5) return 'text-warning';
    return 'text-error';
  }

  function statusBadge(status) {
    if (status === 'healthy') return 'badge-success';
    if (status === 'warning') return 'badge-warning';
    return 'badge-error';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-semibold">CDP Management</h2>
      <p class="opacity-70">Manage your collateralized debt positions</p>
    </div>
    <button class="btn btn-primary">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 mr-2"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      Create New CDP
    </button>
  </div>

  <!-- CDP Selector -->
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Your CDPs</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {#each cdpPositions as cdp}
          <button
            class={
              "p-4 border border-base-300 rounded-lg text-left transition hover:bg-base-100 " +
              (selectedCDP === cdp.id ? "border-primary bg-primary/10" : "")
            }
            on:click={() => (selectedCDP = cdp.id)}
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{cdp.id}</span>
              <div class={"badge " + statusBadge(cdp.status)}>
                {cdp.status.charAt(0).toUpperCase() + cdp.status.slice(1)}
              </div>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="opacity-70">Collateral:</span>
                <span>{cdp.totalCollateral}</span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-70">Debt:</span>
                <span>{cdp.totalDebt}</span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-70">Health:</span>
                <span class={healthColor(cdp.healthRatio)}>{cdp.healthRatio.toFixed(2)}</span>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if currentCDP}
    <div class="space-y-6">
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="card-title">{currentCDP.id} Overview</h2>
            <div class={"badge " + statusBadge(currentCDP.status)}>
              {currentCDP.status.charAt(0).toUpperCase() + currentCDP.status.slice(1)}
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div>
              <div class="text-sm opacity-70">Total Collateral</div>
              <div class="text-xl font-semibold">{currentCDP.totalCollateral}</div>
            </div>
            <div>
              <div class="text-sm opacity-70">Total Debt</div>
              <div class="text-xl font-semibold">{currentCDP.totalDebt}</div>
            </div>
            <div>
              <div class="text-sm opacity-70">Health Ratio</div>
              <div class={'text-xl font-semibold ' + healthColor(currentCDP.healthRatio)}>{currentCDP.healthRatio.toFixed(2)}</div>
            </div>
            <div>
              <div class="text-sm opacity-70">Liquidation Price</div>
              <div class="text-xl font-semibold">{currentCDP.liquidationPrice}</div>
            </div>
          </div>

          <div class="mt-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm opacity-70">Health Ratio</span>
              <span class="text-sm">{currentCDP.healthRatio < 1.5 ? 'Risk of Liquidation' : 'Safe'}</span>
            </div>
            <progress class="progress progress-primary h-3" max="100" value={Math.min(currentCDP.healthRatio * 25, 100)}></progress>
            <div class="flex justify-between text-xs opacity-70 mt-1">
              <span>1.0 (Liquidation)</span>
              <span>2.0+ (Safe)</span>
            </div>
          </div>

          {#if currentCDP.healthRatio < 1.5}
            <div role="alert" class="alert alert-warning mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"/></svg>
              <span>Your CDP is at risk of liquidation. Consider adding more collateral or repaying debt.</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title">Collaterals</h3>
              <button class="btn btn-sm btn-primary">Add</button>
            </div>

            <div class="mt-3 space-y-3">
              {#each currentCDP.collaterals as collateral, index}
                <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{collateral.logo}</span>
                    <div>
                      <div class="font-medium">{collateral.asset}</div>
                      <div class="text-sm opacity-70 flex items-center gap-2">
                        <span>{collateral.price}</span>
                        <div class="flex items-center gap-1" class:text-success={collateral.isPositive} class:text-error={!collateral.isPositive}>
                          {#if collateral.isPositive}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
                          {/if}
                          <span>{collateral.change24h}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="text-right">
                      <div class="text-sm opacity-70">Amount</div>
                      <div class="font-medium">{collateral.amount} {collateral.asset}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm opacity-70">Value</div>
                      <div class="font-medium">{collateral.value}</div>
                    </div>
                    <div class="flex gap-2">
                      <button class="btn btn-sm btn-outline">Add</button>
                      <button class="btn btn-sm btn-outline">Remove</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title">Borrowed Assets</h3>
              <button class="btn btn-sm btn-primary">Borrow</button>
            </div>

            <div class="mt-3 space-y-3">
              {#each currentCDP.loans as loan, index}
                <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{loan.logo}</span>
                    <div>
                      <div class="font-medium">{loan.asset}</div>
                      <div class="text-sm opacity-70 flex items-center gap-2">
                        <span>{loan.price}</span>
                        <div class="flex items-center gap-1" class:text-success={loan.isPositive} class:text-error={!loan.isPositive}>
                          {#if loan.isPositive}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
                          {/if}
                          <span>{loan.change24h}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="text-right">
                      <div class="text-sm opacity-70">Borrowed</div>
                      <div class="font-medium">{loan.borrowed} {loan.asset}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm opacity-70">Interest</div>
                      <div class="font-medium text-warning">{loan.interestRate}</div>
                    </div>
                    <div class="flex gap-2">
                      <button class="btn btn-sm btn-outline">Repay</button>
                      <button class="btn btn-sm btn-outline">Borrow</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Available Assets -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="card-title">Available Collaterals</h3>
            <div class="mt-3 space-y-3">
              {#each availableCollaterals as collateral}
                <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{collateral.logo}</span>
                    <div>
                      <div class="font-medium">{collateral.asset}</div>
                      <div class="text-sm opacity-70 flex items-center gap-2">
                        <span>{collateral.price}</span>
                        <div class="flex items-center gap-1" class:text-success={collateral.isPositive} class:text-error={!collateral.isPositive}>
                          {#if collateral.isPositive}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
                          {/if}
                          <span>{collateral.change24h}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="text-right">
                      <div class="text-sm opacity-70">LTV</div>
                      <div class="font-medium">{collateral.ltv}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm opacity-70">Total Supplied</div>
                      <div class="font-medium">{collateral.totalSupplied}</div>
                    </div>
                    <button class="btn btn-sm btn-primary">Supply</button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="card-title">Available Loan Resources</h3>
            <div class="mt-3 space-y-3">
              {#each availableLoanResources as loanResource}
                <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{loanResource.logo}</span>
                    <div>
                      <div class="font-medium">{loanResource.asset}</div>
                      <div class="text-sm opacity-70 flex items-center gap-2">
                        <span>{loanResource.price}</span>
                        <div class="flex items-center gap-1" class:text-success={loanResource.isPositive} class:text-error={!loanResource.isPositive}>
                          {#if loanResource.isPositive}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
                          {/if}
                          <span>{loanResource.change24h}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="text-right">
                      <div class="text-sm opacity-70">Borrow APR</div>
                      <div class="font-medium text-warning">{loanResource.borrowApr}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm opacity-70">Available Liquidity</div>
                      <div class="font-medium">{loanResource.availableLiquidity}</div>
                    </div>
                    <button class="btn btn-sm btn-outline">Borrow</button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-error">CDP not found</div>
  {/if}
</div>
