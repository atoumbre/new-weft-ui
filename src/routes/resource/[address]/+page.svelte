<script lang='ts'>
  import { page } from '$app/stores'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte'
  import StatusBadge from '$lib/components/common/StatusBadge.svelte'
  import { fPercent, fValue } from '$lib/utils'

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

  // Helper function to get service status text
  function getServiceStatusText(enabled: boolean, locked: boolean): string {
    if (!enabled) return 'Disabled'
    if (locked) return 'Locked'
    return 'Active'
  }
</script>

<svelte:head>
  <title>{name} Resource Details - Weft Dashboard</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <button class="btn btn-ghost btn-sm" onclick={() => history.back()}>
      ← Back
    </button>
    <h1 class="text-2xl font-bold">Resource Details</h1>
  </div>

  {#if marketInfoStore.loading}
    <div class="flex justify-center items-center min-h-64">
      <span class="loading loading-spinner loading-lg"></span>
      <span class="ml-3">Loading resource details...</span>
    </div>
  {:else if !resourceExists}
    <div class="card bg-base-200">
      <div class="card-body text-center">
        <h2 class="card-title justify-center text-error">Resource Not Found</h2>
        <p class="opacity-70">The resource address "{resourceAddress}" was not found in the market.</p>
      </div>
    </div>
  {:else}
    <!-- Resource Header -->
    <div class="card bg-base-200/60">
      <div class="card-body">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-6">
            <AssetCard {symbol} {iconUrl} {previousPriceUsd} {priceUsd} />
            <div class="flex gap-2">
              {#if collateralResource}
                <div class="badge badge-primary">Collateral</div>
              {/if}
              {#if loanResource}
                <div class="badge badge-secondary">Loan</div>
              {/if}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm opacity-70">Resource Address</div>
            <div class="font-mono text-sm">{resourceAddress}</div>
          </div>
        </div>

        {#if description}
          <div class="mt-4">
            <p class="opacity-80">{description}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Price Information -->
      <div class="card bg-base-200/60">
        <div class="card-body">
          <h3 class="card-title text-sm">Price Information</h3>
          <div class="space-y-2">
            <div>
              <div class="text-lg font-bold">{fValue(priceUsd)}</div>
              <div class="text-xs opacity-70">Current USD Price</div>
            </div>
            <div>
              <div class="text-sm {priceUsd.gte(previousPriceUsd) ? 'text-success' : 'text-error'}">
                {priceUsd.gte(previousPriceUsd) ? '+' : ''}{fPercent(priceUsd.sub(previousPriceUsd).div(previousPriceUsd))}
              </div>
              <div class="text-xs opacity-70">24h Change</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Parameters -->
      {#if collateralResource}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title text-sm">Collateral Risk</h3>
            <div class="space-y-2">
              <div>
                <div class="text-lg font-bold">{fPercent(collateralResource.riskConfig.loanToValueRatio)}</div>
                <div class="text-xs opacity-70">LTV Ratio</div>
              </div>
              <div>
                <div class="text-sm">{fPercent(collateralResource.riskConfig.loanToValueRatio.add(collateralResource.riskConfig.liquidationThresholdSpread))}</div>
                <div class="text-xs opacity-70">Liquidation LTV</div>
              </div>
              <div>
                <div class="text-sm">{fPercent(collateralResource.riskConfig.liquidationBonusRate)}</div>
                <div class="text-xs opacity-70">Liquidation Penalty</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if loanResource}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title text-sm">Loan Risk</h3>
            <div class="space-y-2">
              <div>
                <div class="text-lg font-bold">{fPercent(loanResource.riskConfig.loanValueFactor)}</div>
                <div class="text-xs opacity-70">Loan Value Factor</div>
              </div>
              <div>
                <div class="text-sm">{fPercent(loanResource.riskConfig.loanCloseFactor)}</div>
                <div class="text-xs opacity-70">Loan Close Factor</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Pool Information -->
      {#if loanResource?.lendingPoolState}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title text-sm">Pool Metrics</h3>
            <div class="space-y-2">
              <div>
                <div class="text-lg font-bold text-success">{fPercent(loanResource.lendingPoolState.netLendingApr)}</div>
                <div class="text-xs opacity-70">Supply APR</div>
              </div>
              <div>
                <div class="text-sm text-warning">{fPercent(loanResource.lendingPoolState.borrowingApr)}</div>
                <div class="text-xs opacity-70">Borrow APR</div>
              </div>
              <div>
                <UtilizationBar value={loanResource.lendingPoolState.utilizationRate.mul(100)} />
                <div class="text-xs opacity-70">Utilization</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Deposit Information -->
      {#if collateralResource}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title text-sm">Deposits</h3>
            <div class="space-y-2">
              <div>
                <AmountDisplay amount={collateralResource.totalDeposit} usd={collateralResource.totalDeposit.mul(priceUsd)} />
                <div class="text-xs opacity-70">Total Deposited</div>
              </div>
              <div>
                <AmountDisplay amount={collateralResource.totalDepositUnderDU} usd={collateralResource.totalDepositUnderDU.mul(priceUsd)} />
                <div class="text-xs opacity-70">Deposited & Lent</div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Pool Details (for loan resources) -->
    {#if loanResource?.lendingPoolState}
      <div class="card bg-base-200/60">
        <div class="card-body">
          <h3 class="card-title">Lending Pool Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <div class="text-sm opacity-70">Total Supplied</div>
              <AmountDisplay amount={loanResource.lendingPoolState.totalDeposit} usd={loanResource.lendingPoolState.totalDeposit.mul(priceUsd)} />
            </div>
            <div>
              <div class="text-sm opacity-70">Total Borrowed</div>
              <AmountDisplay amount={loanResource.lendingPoolState.totalLoan} usd={loanResource.lendingPoolState.totalLoan.mul(priceUsd)} />
            </div>
            <div>
              <div class="text-sm opacity-70">Available Liquidity</div>
              <AmountDisplay amount={loanResource.lendingPoolState.totalDeposit.sub(loanResource.lendingPoolState.totalLoan)} usd={loanResource.lendingPoolState.totalDeposit.sub(loanResource.lendingPoolState.totalLoan).mul(priceUsd)} />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Efficiency Configurations (for collateral resources) -->
    {#if collateralResource && Object.keys(collateralResource.efficiencyConfigs).length > 0}
      <div class="card bg-base-200/60">
        <div class="card-body">
          <h3 class="card-title">Efficiency Configurations</h3>
          <div class="overflow-x-auto mt-4">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Description</th>
                  <th>LTV Ratio</th>
                  <th>Liquidation LTV</th>
                  <th>Liquidation Penalty</th>
                </tr>
              </thead>
              <tbody>
                {#each Object.entries(collateralResource.efficiencyConfigs) as [groupId, config]}
                  <tr>
                    <td class="font-mono text-sm">{groupId}</td>
                    <td>{config.group.description}</td>
                    <td>{fPercent(config.config.loanToValueRatio)}</td>
                    <td>{fPercent(config.config.loanToValueRatio.add(config.config.liquidationThresholdSpread))}</td>
                    <td>{fPercent(config.config.liquidationBonusRate)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}

    <!-- Services Status -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {#if loanResource}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title">Loan Services</h3>
            <div class="space-y-2 mt-4">
              {#each Object.entries(loanResource.services) as [service, status]}
                <div class="flex items-center justify-between">
                  <span class="font-medium">{service}</span>
                  <StatusBadge
                    status={getServiceStatusText(status.enabled, status.locked)}
                  />
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if collateralResource}
        <div class="card bg-base-200/60">
          <div class="card-body">
            <h3 class="card-title">Collateral Services</h3>
            <div class="space-y-2 mt-4">
              {#each Object.entries(collateralResource.services) as [service, status]}
                <div class="flex items-center justify-between">
                  <span class="font-medium">{service}</span>
                  <StatusBadge
                    status={getServiceStatusText(status.enabled, status.locked)}
                  />
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Resource Configuration -->
    <div class="card bg-base-200/60">
      <div class="card-body">
        <h3 class="card-title">Configuration Details</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {#if loanResource}
            <div>
              <h4 class="font-semibold mb-2">Loan Configuration</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="opacity-70">Loan Config ID:</span>
                  <span>{loanResource.resourceConfig.loanConfigId}</span>
                </div>
                <div class="flex justify-between">
                  <span class="opacity-70">Efficiency Group ID:</span>
                  <span>{loanResource.resourceConfig.efficiencyGroupId || 'None'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="opacity-70">Excluded Isolation Groups:</span>
                  <span>{loanResource.resourceConfig.excludedIsolationGroupIds.length}</span>
                </div>
              </div>
            </div>
          {/if}

          {#if collateralResource}
            <div>
              <h4 class="font-semibold mb-2">Collateral Configuration</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="opacity-70">Collateral Config ID:</span>
                  <span>{collateralResource.resourceConfig.collateralConfigId}</span>
                </div>
                <div class="flex justify-between">
                  <span class="opacity-70">Isolation Group ID:</span>
                  <span>{collateralResource.resourceConfig.isolationGroupId || 'None'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="opacity-70">Efficiency Groups:</span>
                  <span>{collateralResource.resourceConfig.efficiencyGroupIds.length}</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="card bg-base-200/60">
      <div class="card-body">
        <h3 class="card-title">Actions</h3>
        <div class="flex gap-4 mt-4">
          {#if loanResource}
            <button class="btn btn-primary">Supply</button>
            <button class="btn btn-secondary">Borrow</button>
          {/if}
          {#if collateralResource}
            <button class="btn btn-primary">Supply as Collateral</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>