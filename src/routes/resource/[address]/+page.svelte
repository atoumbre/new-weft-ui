<script lang='ts'>
  import { page } from '$app/stores'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte'
  import StatusBadge from '$lib/components/common/StatusBadge.svelte'
  import { dec, fPercent, fValue } from '$lib/utils'

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

  const resourceAddress = $derived($page.params.address as string)

  // Find resource in both loan and collateral arrays
  const loanResource = $derived(marketInfoStore.getLoanResource(resourceAddress))
  const collateralResource = $derived(marketInfoStore.getCollateralResource(resourceAddress))

  const resourceExists = $derived(loanResource || collateralResource)

  // Get price and resource details
  const priceData = $derived(priceStore.getPrice(resourceAddress))
  const priceUsd = $derived(xrdPriceStore.xrdPrice.mul(priceData.current))
  const previousPriceUsd = $derived(xrdPriceStore.xrdPreviousPrice.mul(priceData.previous))
  const priceChangePct = $derived.by(() => {
    if (previousPriceUsd.isZero())
      return dec(0)
    return priceUsd.sub(previousPriceUsd).div(previousPriceUsd)
  })
  const isPriceUp = $derived(priceChangePct.gte(dec(0)))

  // Get resource metadata
  const resourceDetails = $derived(loanResource?.resourceDetails || collateralResource?.resourceDetails)
  const symbol = $derived(
    resourceDetails?.$metadata?.symbol ||
    resourceDetails?.$metadata?.name ||
    resourceAddress.slice(-4)
  )
  const iconUrl = $derived(resourceDetails?.$metadata?.iconUrl)
  const name = $derived(resourceDetails?.$metadata?.name || symbol)
  const description = $derived(resourceDetails?.$metadata?.description || '')
  const metadataTags = $derived.by(() => {
    const tags = resourceDetails?.$metadata?.tags
    return Array.isArray(tags) ? tags : []
  })

  // Helper function to get service status text
  function getServiceStatusText(enabled: boolean, locked: boolean): string {
    if (!enabled)
      return 'Disabled'
    if (locked)
      return 'Locked'
    return 'Active'
  }

  const lendingPoolState = $derived(loanResource?.lendingPoolState)
  const lendingAvailableLiquidity = $derived.by(() =>
    lendingPoolState ? lendingPoolState.totalDeposit.sub(lendingPoolState.totalLoan) : dec(0),
  )
  const lendingLiquidityUsd = $derived(lendingAvailableLiquidity.mul(priceUsd))
  const lendingTotalDepositUsd = $derived(lendingPoolState ? lendingPoolState.totalDeposit.mul(priceUsd) : dec(0))
  const lendingTotalLoanUsd = $derived(lendingPoolState ? lendingPoolState.totalLoan.mul(priceUsd) : dec(0))

  const collateralTotals = $derived.by(() => {
    if (!collateralResource)
      return {
        deposited: dec(0),
        depositedUsd: dec(0),
        underDu: dec(0),
        underDuUsd: dec(0),
      }

    return {
      deposited: collateralResource.totalDeposit,
      depositedUsd: collateralResource.totalDeposit.mul(priceUsd),
      underDu: collateralResource.totalDepositUnderDU,
      underDuUsd: collateralResource.totalDepositUnderDU.mul(priceUsd),
    }
  })

  // Helper function to find loan resources that share the same efficiency group ID
  const getPeerLoanResources = $derived.by(() => {
    if (!collateralResource) return {}

    const peersByGroupId: Record<string, any[]> = {}
    const allLoanResources = marketInfoStore.loanResources || []

    console.log('Debug efficiency groups:')
    console.log('Collateral efficiency configs:', Object.keys(collateralResource.efficiencyConfigs))
    console.log('Total loan resources:', allLoanResources.length)

    // For each efficiency group this collateral participates in
    Object.keys(collateralResource.efficiencyConfigs).forEach(groupId => {
      console.log(`Looking for peers in group: ${groupId}`)

      // Find all loan resources that have this efficiency group ID
      const peers = allLoanResources.filter(loanRes => {
        const hasMatchingGroup = dec(loanRes.resourceConfig.efficiencyGroupId??'-1').eq(groupId??'-2')
        if (hasMatchingGroup) {
          console.log(`Found peer: ${loanRes.resourceAddress} (${loanRes.resourceDetails?.$metadata?.symbol})`)
        }
        return hasMatchingGroup
      })

      console.log(`Found ${peers.length} peers for group ${groupId}`)
      peersByGroupId[groupId] = peers
    })

    console.log('Final peers by group:', peersByGroupId)
    return peersByGroupId
  })
</script>

<svelte:head>
  <title>{name} Resource Details - Weft Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
  <!-- Header -->
  <div class="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300/50">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center gap-4">
        <button class="btn btn-ghost btn-sm" onclick={() => history.back()}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
        <div class="text-sm breadcrumbs">
          <ul>
            <li><a href="/" class="opacity-60">Dashboard</a></li>
            <li class="opacity-60">Resources</li>
            <li>{symbol}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-6 py-8">
    {#if marketInfoStore.loading}
      <div class="flex justify-center items-center min-h-[60vh]">
        <div class="text-center space-y-4">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="text-base-content/70">Loading resource details...</p>
        </div>
      </div>
    {:else if !resourceExists}
      <div class="flex justify-center items-center min-h-[60vh]">
        <div class="card bg-base-100 shadow-xl max-w-md">
          <div class="card-body text-center">
            <svg class="w-16 h-16 mx-auto text-error opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h2 class="text-xl font-semibold text-error mt-4">Resource Not Found</h2>
            <p class="text-base-content/70 mt-2">The resource address "{resourceAddress}" was not found in the market.</p>
            <div class="card-actions justify-center mt-6">
              <button class="btn btn-primary" onclick={() => history.back()}>Go Back</button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Hero Section -->
      <section class="mb-12">
        <div class="card bg-base-100 shadow-xl border border-base-300/50">
          <div class="card-body p-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div class="flex items-start gap-6">
                <div class="avatar">
                  <div class="mask mask-squircle w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 border border-base-300">
                    {#if iconUrl?.startsWith('http')}
                      <img src={iconUrl} alt={`${symbol} icon`} class="object-cover" />
                    {:else}
                      <div class="flex h-full w-full items-center justify-center text-xl font-bold text-primary">
                        {symbol.slice(0, 3)}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex flex-wrap items-center gap-3">
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{name}</h1>
                    <span class="badge badge-outline badge-lg">{symbol}</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-3">
                    {#if loanResource}
                      <div class="badge badge-success gap-2">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                        </svg>
                        Lending Available
                      </div>
                    {/if}
                    {#if collateralResource}
                      <div class="badge badge-info gap-2">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"/>
                        </svg>
                        Collateral Enabled
                      </div>
                    {/if}
                    {#if metadataTags.length}
                      {#each metadataTags.slice(0, 3) as tag}
                        <span class="badge badge-ghost badge-sm">{tag}</span>
                      {/each}
                    {/if}
                  </div>

                  <div class="text-xs font-mono text-base-content/60 break-all bg-base-200 rounded-lg px-3 py-2">
                    {resourceAddress}
                  </div>

                  {#if description}
                    <p class="max-w-2xl text-base-content/80 leading-relaxed">{description}</p>
                  {/if}
                </div>
              </div>

              <div class="card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 min-w-[280px]">
                <div class="card-body p-6">
                  <div class="text-sm opacity-70 font-medium mb-2">Current Price</div>
                  <div class="text-2xl font-bold">{fValue(priceUsd)}</div>
                  <div class={`flex items-center gap-2 text-sm font-medium ${isPriceUp ? 'text-success' : 'text-error'}`}>
                    <svg class="w-4 h-4" viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                      {#if isPriceUp}
                        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' />
                      {:else}
                        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' />
                      {/if}
                    </svg>
                    {isPriceUp ? '+' : ''}{fPercent(priceChangePct.abs())}
                    <span class="text-base-content/50 font-normal">24h</span>
                  </div>
                  <div class="text-xs text-base-content/60 mt-2">
                    Previous: {fValue(previousPriceUsd)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <!-- Lending Market Section -->
      {#if loanResource}
        <section class="mb-12" id="lending-section">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-1 h-8 bg-gradient-to-b from-success to-success/60 rounded-full"></div>
            <div class="flex-1">
              <h2 class="text-xl font-bold flex items-center gap-3">
                <svg class="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
                Lending Market
              </h2>
              <p class="text-sm opacity-70 mt-1">Supply liquidity to earn yield or borrow against collateral</p>
            </div>
            <div class="flex gap-3">
              <button class="btn btn-success gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Supply
              </button>
              <button class="btn btn-outline gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                Borrow
              </button>
            </div>
          </div>

          <!-- Lending Key Metrics -->
          <div class="grid gap-4 md:grid-cols-3 mb-8">
            <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Supply APY</h3>
                  <div class="badge badge-success badge-xs"></div>
                </div>
                <div class="text-xl font-bold text-success mb-2">{fPercent(lendingPoolState?.netLendingApr)}</div>
                <p class="text-xs opacity-60">Current yield for suppliers</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Borrow APY</h3>
                  <div class="badge badge-warning badge-xs"></div>
                </div>
                <div class="text-xl font-bold text-warning mb-2">{fPercent(lendingPoolState?.borrowingApr)}</div>
                <p class="text-xs opacity-60">Current rate for borrowers</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Utilization</h3>
                  <div class="badge badge-info badge-xs"></div>
                </div>
                <div class="text-xl font-bold mb-2">{fPercent(lendingPoolState?.utilizationRate)}</div>
                <div class="w-full">
                  <UtilizationBar value={lendingPoolState?.utilizationRate.mul(100)} />
                </div>
              </div>
            </div>
          </div>

          <!-- Market Stats -->
          <div class="grid gap-6 lg:grid-cols-3 mb-8">
            <div class="card bg-base-100 shadow-lg border border-success/20">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Total Supplied</h3>
                  <div class="w-2 h-2 rounded-full bg-success"></div>
                </div>
                <AmountDisplay amount={lendingPoolState?.totalDeposit ?? dec(0)} usd={lendingTotalDepositUsd} />
                <p class="text-xs opacity-60 mt-2">Principal provided by all suppliers</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg border border-warning/20">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Total Borrowed</h3>
                  <div class="w-2 h-2 rounded-full bg-warning"></div>
                </div>
                <AmountDisplay amount={lendingPoolState?.totalLoan ?? dec(0)} usd={lendingTotalLoanUsd} />
                <p class="text-xs opacity-60 mt-2">Outstanding debt against this asset</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg border border-info/20">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Available Liquidity</h3>
                  <div class="w-2 h-2 rounded-full bg-info"></div>
                </div>
                <AmountDisplay amount={lendingAvailableLiquidity} usd={lendingLiquidityUsd} />
                <p class="text-xs opacity-60 mt-2">Remaining capacity for borrowing</p>
              </div>
            </div>
          </div>

          <!-- Risk Parameters -->
          <div class="card bg-base-100 shadow-lg mb-6">
            <div class="card-header px-6 pt-6 pb-2">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Risk Parameters
              </h3>
            </div>
            <div class="card-body px-6 pt-2">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                  <div>
                    <dt class="text-sm font-medium text-base-content/70">Loan Value Factor</dt>
                    <dd class="text-xs text-base-content/60">Determines borrowing capacity</dd>
                  </div>
                  <dd class="text-lg font-bold">{fPercent(loanResource.riskConfig.loanValueFactor)}</dd>
                </div>
                <div class="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                  <div>
                    <dt class="text-sm font-medium text-base-content/70">Loan Close Factor</dt>
                    <dd class="text-xs text-base-content/60">Maximum liquidation percentage</dd>
                  </div>
                  <dd class="text-lg font-bold">{fPercent(loanResource.riskConfig.loanCloseFactor)}</dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Details -->
          <div class="mt-8 space-y-4">
            <div class="collapse collapse-arrow bg-base-200/50">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Service Status
              </div>
              <div class="collapse-content">
                <div class="space-y-2 pt-2">
                  {#each Object.entries(loanResource.services) as [service, status]}
                    <div class="flex items-center justify-between p-2 bg-base-100 rounded border border-base-300/40 text-sm">
                      <span class="font-medium capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <StatusBadge status={getServiceStatusText(status.enabled, status.locked)} />
                    </div>
                  {/each}
                </div>
              </div>
            </div>

          </div>
        </section>
      {/if}

      <!-- Collateral Market Section -->
      {#if collateralResource}
        <section class="mb-12" id="collateral-section">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <div class="flex-1">
              <h2 class="text-xl font-bold flex items-center gap-3">
                <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"/>
                </svg>
                Collateral Market
              </h2>
              <p class="text-sm opacity-70 mt-1">Use this asset as collateral to borrow other assets</p>
            </div>
            <button class="btn btn-primary gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              Deposit Collateral
            </button>
          </div>

          <!-- Collateral Risk Overview -->
          <div class="grid gap-6 lg:grid-cols-3 mb-8">
            <div class="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Maximum LTV</h3>
                  <div class="badge badge-primary badge-sm">Risk</div>
                </div>
                <div class="text-xl font-bold text-primary mb-2">{fPercent(collateralResource.riskConfig.loanToValueRatio)}</div>
                <p class="text-xs opacity-60">Maximum borrowing power</p>
              </div>
            </div>

            <div class="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-lg">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Liquidation LTV</h3>
                  <div class="badge badge-warning badge-sm">Critical</div>
                </div>
                <div class="text-xl font-bold text-warning mb-2">
                  {fPercent(collateralResource.riskConfig.loanToValueRatio.add(collateralResource.riskConfig.liquidationThresholdSpread))}
                </div>
                <p class="text-xs opacity-60">Liquidation threshold</p>
              </div>
            </div>

            <div class="card bg-gradient-to-br from-error/10 to-error/5 border border-error/20 shadow-lg">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Liquidation Penalty</h3>
                  <div class="badge badge-error badge-sm">Fee</div>
                </div>
                <div class="text-xl font-bold text-error mb-2">{fPercent(collateralResource.riskConfig.liquidationBonusRate)}</div>
                <p class="text-xs opacity-60">Liquidator bonus</p>
              </div>
            </div>
          </div>

          <!-- Collateral Stats -->
          <div class="grid gap-6 lg:grid-cols-2 mb-8">
            <div class="card bg-base-100 shadow-lg border border-primary/20">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Supplied</h3>
                  <div class="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <AmountDisplay amount={collateralTotals.deposited} usd={collateralTotals.depositedUsd} />
                <p class="text-xs opacity-60 mt-2">Total collateral deposited by all users</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg border border-warning/20">
              <div class="card-body p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm opacity-70 font-medium">Supplied and Lent</h3>
                  <div class="w-2 h-2 rounded-full bg-warning"></div>
                </div>
                <AmountDisplay amount={collateralTotals.underDu} usd={collateralTotals.underDuUsd} />
                <p class="text-xs opacity-60 mt-2">Lending pool deposit units used as collateral</p>
              </div>
            </div>
          </div>


          <!-- Efficiency Modes Table -->
          {#if Object.keys(collateralResource.efficiencyConfigs).length > 0 || loanResource}
            <div class="card bg-base-100 shadow-lg mt-6">
              <div class="card-header px-6 pt-6 pb-2">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Efficiency Modes
                  <span class="badge badge-info badge-sm ml-2">{Object.keys(collateralResource.efficiencyConfigs).length + (loanResource?1:0)}</span>
                </h3>
                <p class="text-sm opacity-70 mt-1">Enhanced collateral parameters for qualified borrowers</p>
              </div>
              <div class="card-body px-6 pt-2">
                <div class="overflow-x-auto">
                  <table class="table table-zebra table-sm">
                    <thead>
                      <tr class="bg-base-200">
                        <th class="font-semibold text-xs">Peers</th>
                        <th class="font-semibold text-center text-xs">Max LTV</th>
                        <th class="font-semibold text-center text-xs">Liquidation LTV</th>
                        <th class="font-semibold text-center text-xs">Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Self-reference row if this collateral is also a loan resource -->
                      {#if loanResource}
                        <tr class="hover:bg-base-100 bg-primary/5">
                          <td class="w-48">
                            <div class="flex items-center gap-2">
                              <div class="avatar">
                                <div class="mask mask-squircle w-6 h-6 bg-primary/20 border border-primary/30">
                                  {#if iconUrl?.startsWith('http')}
                                    <img src={iconUrl} alt={symbol} class="object-cover" />
                                  {:else}
                                    <div class="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                                      {symbol.slice(0, 2)}
                                    </div>
                                  {/if}
                                </div>
                              </div>
                              <span class="text-xs font-semibold text-primary">Self (Base Case)</span>
                            </div>
                            <div class="text-xs text-base-content/60 mt-1">
                              Can borrow against itself as collateral
                            </div>
                          </td>
                          <td class="text-center font-semibold text-primary text-xs">95%</td>
                          <td class="text-center font-semibold text-warning text-xs">97%</td>
                          <td class="text-center font-semibold text-error text-xs">3%</td>
                        </tr>
                      {/if}

                      {#each Object.entries(collateralResource.efficiencyConfigs) as [groupId, config]}
                        <tr class="hover:bg-base-100">
                          <td class="w-48">
                            <div class="flex items-center gap-1 flex-wrap">
                              {#each getPeerLoanResources[groupId] || [] as peer}
                                <div class="tooltip" data-tip={peer.resourceDetails?.$metadata?.symbol || peer.resourceDetails?.$metadata?.name || 'Unknown'}>
                                  <div class="avatar">
                                    <div class="mask mask-squircle w-6 h-6 bg-base-300">
                                      {#if peer.resourceDetails?.$metadata?.iconUrl?.startsWith('http')}
                                        <img src={peer.resourceDetails.$metadata.iconUrl} alt={peer.resourceDetails.$metadata.symbol || 'Token'} class="object-cover" />
                                      {:else}
                                        <div class="flex h-full w-full items-center justify-center text-xs font-bold">
                                          {(peer.resourceDetails?.$metadata?.symbol || peer.resourceDetails?.$metadata?.name || '?').slice(0, 2)}
                                        </div>
                                      {/if}
                                    </div>
                                  </div>
                                </div>
                              {/each}
                              {#if !getPeerLoanResources[groupId] || getPeerLoanResources[groupId].length === 0}
                                <span class="text-xs text-base-content/60 italic">No peers</span>
                              {/if}
                            </div>
                            <div class="text-xs text-base-content/60 mt-1 truncate" title={config.group.description}>
                              {config.group.description}
                            </div>
                          </td>
                          <td class="text-center font-semibold text-primary text-xs">{fPercent(config.config.loanToValueRatio)}</td>
                          <td class="text-center font-semibold text-warning text-xs">{fPercent(config.config.loanToValueRatio.add(config.config.liquidationThresholdSpread))}</td>
                          <td class="text-center font-semibold text-error text-xs">{fPercent(config.config.liquidationBonusRate)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          {/if}

          <!-- Footer Details -->
          <div class="mt-8 space-y-4">
            <div class="collapse collapse-arrow bg-base-200/50">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Service Status
              </div>
              <div class="collapse-content">
                <div class="space-y-2 pt-2">
                  {#each Object.entries(collateralResource.services) as [service, status]}
                    <div class="flex items-center justify-between p-2 bg-base-100 rounded border border-base-300/40 text-sm">
                      <span class="font-medium capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <StatusBadge status={getServiceStatusText(status.enabled, status.locked)} />
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </section>
      {/if}
    {/if}
  </div>
</div>
