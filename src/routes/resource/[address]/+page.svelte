<script lang='ts'>
  import type { LoanResource } from '$lib/internal_modules/dist'
  import { page } from '$app/stores'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import StatusBadge from '$lib/components/common/StatusBadge.svelte'
  import UtilizationBar from '$lib/components/common/UtilizationBar.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fPercent, fValue } from '$lib/utils/common'

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
  const metadata = $derived(
    loanResource?.metadata || collateralResource?.metadata,
  )
  const symbol = $derived(
    metadata?.symbol || metadata?.name || resourceAddress.slice(-4),
  )
  const iconUrl = $derived(metadata?.iconUrl)
  const name = $derived(metadata?.name || symbol)
  const description = $derived(metadata?.description || '')
  const metadataTags = $derived.by(() => {
    const tags = metadata?.tags
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
  const lendingTotalDepositUsd = $derived(
    lendingPoolState ? lendingPoolState.totalDeposit.mul(priceUsd) : dec(0),
  )
  const lendingTotalLoanUsd = $derived(
    lendingPoolState ? lendingPoolState.totalLoan.mul(priceUsd) : dec(0),
  )

  const collateralTotals = $derived.by(() => {
    if (!collateralResource) {
      return {
        deposited: dec(0),
        depositedUsd: dec(0),
        underDu: dec(0),
        underDuUsd: dec(0),
      }
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
    if (!collateralResource)
      return {}

    const peersByGroupId: Record<string, LoanResource[]> = {}
    const allLoanResources = marketInfoStore.loanResources || []

    // For each efficiency group this collateral participates in
    Object.keys(collateralResource.efficiencyConfigs).forEach((groupId) => {
      // Find all loan resources that have this efficiency group ID
      const peers = allLoanResources.filter((loanRes) => {
        const hasMatchingGroup = dec(loanRes.resourceConfig.efficiencyGroupId ?? '-1').eq(
          groupId ?? '-2',
        )

        return hasMatchingGroup
      })

      peersByGroupId[groupId] = peers
    })

    return peersByGroupId
  })
</script>

<svelte:head>
  <title>{name} Resource Details - Weft Dashboard</title>
</svelte:head>

<div class='min-h-screen bg-gradient-to-br from-base-100 to-base-200'>
  <!-- Header -->
  <div class='sticky top-0 z-50 border-b border-base-300/50 bg-base-100/80 backdrop-blur-md'>
    <div class='container mx-auto px-6 py-4'>
      <div class='flex items-center gap-4'>
        <button class='btn btn-ghost btn-sm' onclick={() => history.back()}>
          <svg class='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M15 19l-7-7 7-7'
            ></path>
          </svg>
          Back
        </button>
        <div class='breadcrumbs text-sm'>
          <ul>
            <li><a href='/' class='opacity-60'>Dashboard</a></li>
            <li class='opacity-60'>Resources</li>
            <li>{symbol}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class='container mx-auto px-6 py-8'>
    {#if marketInfoStore.loading}
      <div class='flex min-h-[60vh] items-center justify-center'>
        <div class='space-y-4 text-center'>
          <span class='loading loading-lg loading-spinner'></span>
          <p class='text-base-content/70'>Loading resource details...</p>
        </div>
      </div>
    {:else if !resourceExists}
      <div class='flex min-h-[60vh] items-center justify-center'>
        <div class='card max-w-md bg-base-100 shadow-xl'>
          <div class='card-body text-center'>
            <svg
              class='mx-auto h-16 w-16 text-error opacity-50'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='1.5'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
              ></path>
            </svg>
            <h2 class='mt-4 text-xl font-semibold text-error'>Resource Not Found</h2>
            <p class='mt-2 text-base-content/70'>
              The resource address "{resourceAddress}" was not found in the market.
            </p>
            <div class='mt-6 card-actions justify-center'>
              <button class='btn btn-primary' onclick={() => history.back()}>Go Back</button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Hero Section -->
      <section class='mb-12'>
        <div class='card border border-base-300/50 bg-base-100 shadow-xl'>
          <div class='card-body p-8'>
            <div class='flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between'>
              <div class='flex items-start gap-6'>
                <div class='avatar'>
                  <div
                    class='mask h-20 w-20 border border-base-300 bg-gradient-to-br from-primary/20 to-secondary/20 mask-squircle'
                  >
                    {#if iconUrl?.startsWith('http')}
                      <img src={iconUrl} alt={`${symbol} icon`} class='object-cover' />
                    {:else}
                      <div
                        class='flex h-full w-full items-center justify-center text-xl font-bold text-primary'
                      >
                        {symbol.slice(0, 3)}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class='space-y-3'>
                  <div class='flex flex-wrap items-center gap-3'>
                    <h1
                      class='bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent'
                    >
                      {name}
                    </h1>
                    <span class='badge badge-outline badge-lg'>{symbol}</span>
                  </div>

                  <div class='flex flex-wrap items-center gap-3'>
                    {#if loanResource}
                      <div class='badge gap-2 badge-success'>
                        <svg class='h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                          />
                        </svg>
                        Lending Available
                      </div>
                    {/if}
                    {#if collateralResource}
                      <div class='badge gap-2 badge-info'>
                        <svg class='h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fill-rule='evenodd'
                            d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z'
                            clip-rule='evenodd'
                          />
                        </svg>
                        Collateral Enabled
                      </div>
                    {/if}
                    {#if metadataTags.length}
                      {#each metadataTags.slice(0, 3) as tag}
                        <span class='badge badge-ghost badge-sm'>{tag}</span>
                      {/each}
                    {/if}
                  </div>

                  <div
                    class='rounded-lg bg-base-200 px-3 py-2 font-mono text-xs break-all text-base-content/60'
                  >
                    {resourceAddress}
                  </div>

                  {#if description}
                    <p class='max-w-2xl leading-relaxed text-base-content/80'>{description}</p>
                  {/if}
                </div>
              </div>

              <div
                class='card min-w-[280px] border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5'
              >
                <div class='card-body p-6'>
                  <div class='mb-2 text-sm font-medium opacity-70'>Current Price</div>
                  <div class='text-2xl font-bold'>{fValue(priceUsd)}</div>
                  <div
                    class={`flex items-center gap-2 text-sm font-medium ${isPriceUp ? 'text-success' : 'text-error'}`}
                  >
                    <svg class='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                      {#if isPriceUp}
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          stroke-width='2'
                          d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                        />
                      {:else}
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          stroke-width='2'
                          d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                        />
                      {/if}
                    </svg>
                    {isPriceUp ? '+' : ''}{fPercent(priceChangePct.abs())}
                    <span class='font-normal text-base-content/50'>24h</span>
                  </div>
                  <div class='mt-2 text-xs text-base-content/60'>
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
        <section class='mb-12' id='lending-section'>
          <div class='mb-8 flex items-center gap-4'>
            <div class='h-8 w-1 rounded-full bg-gradient-to-b from-success to-success/60'></div>
            <div class='flex-1'>
              <h2 class='flex items-center gap-3 text-xl font-bold'>
                <svg class='h-6 w-6 text-success' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                  />
                </svg>
                Lending Market
              </h2>
              <p class='mt-1 text-sm opacity-70'>
                Supply liquidity to earn yield or borrow against collateral
              </p>
            </div>
            <div class='flex gap-3'>
              <button class='btn gap-2 btn-success'>
                <svg class='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  ></path>
                </svg>
                Supply
              </button>
              <button class='btn gap-2 btn-outline'>
                <svg class='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M19 14l-7 7m0 0l-7-7m7 7V3'
                  ></path>
                </svg>
                Borrow
              </button>
            </div>
          </div>

          <!-- Lending Key Metrics -->
          <div class='mb-8 grid gap-4 md:grid-cols-3'>
            <div class='card bg-base-100 shadow-md transition-shadow hover:shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Supply APY</h3>
                  <div class='badge badge-xs badge-success'></div>
                </div>
                <div class='mb-2 text-xl font-bold text-success'>
                  {fPercent(lendingPoolState?.netLendingApr)}
                </div>
                <p class='text-xs opacity-60'>Current yield for suppliers</p>
              </div>
            </div>

            <div class='card bg-base-100 shadow-md transition-shadow hover:shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Borrow APY</h3>
                  <div class='badge badge-xs badge-warning'></div>
                </div>
                <div class='mb-2 text-xl font-bold text-warning'>
                  {fPercent(lendingPoolState?.borrowingApr)}
                </div>
                <p class='text-xs opacity-60'>Current rate for borrowers</p>
              </div>
            </div>

            <div class='card bg-base-100 shadow-md transition-shadow hover:shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Utilization</h3>
                  <div class='badge badge-xs badge-info'></div>
                </div>
                <div class='mb-2 text-xl font-bold'>
                  {fPercent(lendingPoolState?.utilizationRate)}
                </div>
                <div class='w-full'>
                  <UtilizationBar value={lendingPoolState?.utilizationRate.mul(100)} />
                </div>
              </div>
            </div>
          </div>

          <!-- Market Stats -->
          <div class='mb-8 grid gap-6 lg:grid-cols-3'>
            <div class='card border border-success/20 bg-base-100 shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Total Supplied</h3>
                  <div class='h-2 w-2 rounded-full bg-success'></div>
                </div>
                <AmountDisplay
                  amount={lendingPoolState?.totalDeposit ?? dec(0)}
                  usd={lendingTotalDepositUsd}
                />
                <p class='mt-2 text-xs opacity-60'>Principal provided by all suppliers</p>
              </div>
            </div>

            <div class='card border border-warning/20 bg-base-100 shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Total Borrowed</h3>
                  <div class='h-2 w-2 rounded-full bg-warning'></div>
                </div>
                <AmountDisplay
                  amount={lendingPoolState?.totalLoan ?? dec(0)}
                  usd={lendingTotalLoanUsd}
                />
                <p class='mt-2 text-xs opacity-60'>Outstanding debt against this asset</p>
              </div>
            </div>

            <div class='card border border-info/20 bg-base-100 shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Available Liquidity</h3>
                  <div class='h-2 w-2 rounded-full bg-info'></div>
                </div>
                <AmountDisplay amount={lendingAvailableLiquidity} usd={lendingLiquidityUsd} />
                <p class='mt-2 text-xs opacity-60'>Remaining capacity for borrowing</p>
              </div>
            </div>
          </div>

          <!-- Risk Parameters -->
          <div class='card mb-6 bg-base-100 shadow-lg'>
            <div class='card-header px-6 pt-6 pb-2'>
              <h3 class='flex items-center gap-2 text-lg font-semibold'>
                <svg
                  class='h-5 w-5 text-primary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  ></path>
                </svg>
                Risk Parameters
              </h3>
            </div>
            <div class='card-body px-6 pt-2'>
              <div class='grid gap-4 md:grid-cols-2'>
                <div class='flex items-center justify-between rounded-lg bg-base-200/50 p-4'>
                  <div>
                    <dt class='text-sm font-medium text-base-content/70'>Loan Value Factor</dt>
                    <dd class='text-xs text-base-content/60'>Determines borrowing capacity</dd>
                  </div>
                  <dd class='text-lg font-bold'>
                    {fPercent(loanResource.riskConfig.loanValueFactor)}
                  </dd>
                </div>
                <div class='flex items-center justify-between rounded-lg bg-base-200/50 p-4'>
                  <div>
                    <dt class='text-sm font-medium text-base-content/70'>Loan Close Factor</dt>
                    <dd class='text-xs text-base-content/60'>Maximum liquidation percentage</dd>
                  </div>
                  <dd class='text-lg font-bold'>
                    {fPercent(loanResource.riskConfig.loanCloseFactor)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Details -->
          <div class='mt-8 space-y-4'>
            <div class='collapse-arrow collapse bg-base-200/50'>
              <input type='checkbox' />
              <div class='collapse-title flex items-center gap-2 text-sm font-medium'>
                <svg
                  class='h-4 w-4 text-secondary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  ></path>
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  ></path>
                </svg>
                Service Status
              </div>
              <div class='collapse-content'>
                <div class='space-y-2 pt-2'>
                  {#each Object.entries(loanResource.services) as [service, status]}
                    <div
                      class='flex items-center justify-between rounded border border-base-300/40 bg-base-100 p-2 text-sm'
                    >
                      <span class='font-medium capitalize'
                      >{service.replace(/([A-Z])/g, ' $1').trim()}</span
                      >
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
        <section class='mb-12' id='collateral-section'>
          <div class='mb-8 flex items-center gap-4'>
            <div class='h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/60'></div>
            <div class='flex-1'>
              <h2 class='flex items-center gap-3 text-xl font-bold'>
                <svg class='h-6 w-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fill-rule='evenodd'
                    d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z'
                    clip-rule='evenodd'
                  />
                </svg>
                Collateral Market
              </h2>
              <p class='mt-1 text-sm opacity-70'>
                Use this asset as collateral to borrow other assets
              </p>
            </div>
            <button class='btn gap-2 btn-primary'>
              <svg class='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                ></path>
              </svg>
              Deposit Collateral
            </button>
          </div>

          <!-- Collateral Risk Overview -->
          <div class='mb-8 grid gap-6 lg:grid-cols-3'>
            <div
              class='card border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg'
            >
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Maximum LTV</h3>
                  <div class='badge badge-sm badge-primary'>Risk</div>
                </div>
                <div class='mb-2 text-xl font-bold text-primary'>
                  {fPercent(collateralResource.riskConfig.loanToValueRatio)}
                </div>
                <p class='text-xs opacity-60'>Maximum borrowing power</p>
              </div>
            </div>

            <div
              class='card border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 shadow-lg'
            >
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Liquidation LTV</h3>
                  <div class='badge badge-sm badge-warning'>Critical</div>
                </div>
                <div class='mb-2 text-xl font-bold text-warning'>
                  {fPercent(
                    collateralResource.riskConfig.loanToValueRatio.add(
                      collateralResource.riskConfig.liquidationThresholdSpread,
                    ),
                  )}
                </div>
                <p class='text-xs opacity-60'>Liquidation threshold</p>
              </div>
            </div>

            <div
              class='card border border-error/20 bg-gradient-to-br from-error/10 to-error/5 shadow-lg'
            >
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Liquidation Penalty</h3>
                  <div class='badge badge-sm badge-error'>Fee</div>
                </div>
                <div class='mb-2 text-xl font-bold text-error'>
                  {fPercent(collateralResource.riskConfig.liquidationBonusRate)}
                </div>
                <p class='text-xs opacity-60'>Liquidator bonus</p>
              </div>
            </div>
          </div>

          <!-- Collateral Stats -->
          <div class='mb-8 grid gap-6 lg:grid-cols-2'>
            <div class='card border border-primary/20 bg-base-100 shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Supplied</h3>
                  <div class='h-2 w-2 rounded-full bg-primary'></div>
                </div>
                <AmountDisplay
                  amount={collateralTotals.deposited}
                  usd={collateralTotals.depositedUsd}
                />
                <p class='mt-2 text-xs opacity-60'>Total collateral deposited by all users</p>
              </div>
            </div>

            <div class='card border border-warning/20 bg-base-100 shadow-lg'>
              <div class='card-body p-6'>
                <div class='mb-4 flex items-center justify-between'>
                  <h3 class='text-sm font-medium opacity-70'>Supplied and Lent</h3>
                  <div class='h-2 w-2 rounded-full bg-warning'></div>
                </div>
                <AmountDisplay
                  amount={collateralTotals.underDu}
                  usd={collateralTotals.underDuUsd}
                />
                <p class='mt-2 text-xs opacity-60'>Lending pool deposit units used as collateral</p>
              </div>
            </div>
          </div>

          <!-- Efficiency Modes Table -->
          {#if Object.keys(collateralResource.efficiencyConfigs).length > 0 || loanResource}
            <div class='card mt-6 bg-base-100 shadow-lg'>
              <div class='card-header px-6 pt-6 pb-2'>
                <h3 class='flex items-center gap-2 text-lg font-semibold'>
                  <svg
                    class='h-5 w-5 text-info'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      stroke-width='2'
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    ></path>
                  </svg>
                  Efficiency Modes
                  <span class='ml-2 badge badge-sm badge-info'
                  >{Object.keys(collateralResource.efficiencyConfigs).length
                    + (loanResource ? 1 : 0)}</span
                  >
                </h3>
                <p class='mt-1 text-sm opacity-70'>
                  Enhanced collateral parameters for qualified borrowers
                </p>
              </div>
              <div class='card-body px-6 pt-2'>
                <div class='overflow-x-auto'>
                  <table class='table table-zebra table-sm'>
                    <thead>
                      <tr class='bg-base-200'>
                        <th class='text-xs font-semibold'>Peers</th>
                        <th class='text-center text-xs font-semibold'>Max LTV</th>
                        <th class='text-center text-xs font-semibold'>Liquidation LTV</th>
                        <th class='text-center text-xs font-semibold'>Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Self-reference row if this collateral is also a loan resource -->
                      {#if loanResource}
                        <tr class='bg-primary/5 hover:bg-base-100'>
                          <td class='w-48'>
                            <div class='flex items-center gap-2'>
                              <div class='avatar'>
                                <div
                                  class='mask h-6 w-6 border border-primary/30 bg-primary/20 mask-squircle'
                                >
                                  {#if iconUrl?.startsWith('http')}
                                    <img src={iconUrl} alt={symbol} class='object-cover' />
                                  {:else}
                                    <div
                                      class='flex h-full w-full items-center justify-center text-xs font-bold text-primary'
                                    >
                                      {symbol.slice(0, 2)}
                                    </div>
                                  {/if}
                                </div>
                              </div>
                              <span class='text-xs font-semibold text-primary'
                              >Self (Base Case)</span
                              >
                            </div>
                            <div class='mt-1 text-xs text-base-content/60'>
                              Can borrow against itself as collateral
                            </div>
                          </td>
                          <td class='text-center text-xs font-semibold text-primary'>95%</td>
                          <td class='text-center text-xs font-semibold text-warning'>97%</td>
                          <td class='text-center text-xs font-semibold text-error'>3%</td>
                        </tr>
                      {/if}

                      {#each Object.entries(collateralResource.efficiencyConfigs) as [groupId, config]}
                        <tr class='hover:bg-base-100'>
                          <td class='w-48'>
                            <div class='flex flex-wrap items-center gap-1'>
                              {#each getPeerLoanResources[groupId] || [] as peer}
                                <div
                                  class='tooltip'
                                  data-tip={peer.metadata?.symbol
                                    || peer.metadata?.name
                                    || 'Unknown'}
                                >
                                  <div class='avatar'>
                                    <div class='mask h-6 w-6 bg-base-300 mask-squircle'>
                                      {#if peer.metadata?.iconUrl?.startsWith('http')}
                                        <img
                                          src={peer.metadata.iconUrl}
                                          alt={peer.metadata.symbol || 'Token'}
                                          class='object-cover'
                                        />
                                      {:else}
                                        <div
                                          class='flex h-full w-full items-center justify-center text-xs font-bold'
                                        >
                                          {(
                                            peer.metadata?.symbol
                                            || peer.metadata?.name
                                            || '?'
                                          ).slice(0, 2)}
                                        </div>
                                      {/if}
                                    </div>
                                  </div>
                                </div>
                              {/each}
                              {#if !getPeerLoanResources[groupId] || getPeerLoanResources[groupId].length === 0}
                                <span class='text-xs text-base-content/60 italic'>No peers</span>
                              {/if}
                            </div>
                            <div
                              class='mt-1 truncate text-xs text-base-content/60'
                              title={config.group.description}
                            >
                              {config.group.description}
                            </div>
                          </td>
                          <td class='text-center text-xs font-semibold text-primary'
                          >{fPercent(config.config.loanToValueRatio)}</td
                          >
                          <td class='text-center text-xs font-semibold text-warning'
                          >{fPercent(
                            config.config.loanToValueRatio.add(
                              config.config.liquidationThresholdSpread,
                            ),
                          )}</td
                          >
                          <td class='text-center text-xs font-semibold text-error'
                          >{fPercent(config.config.liquidationBonusRate)}</td
                          >
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          {/if}

          <!-- Footer Details -->
          <div class='mt-8 space-y-4'>
            <div class='collapse-arrow collapse bg-base-200/50'>
              <input type='checkbox' />
              <div class='collapse-title flex items-center gap-2 text-sm font-medium'>
                <svg
                  class='h-4 w-4 text-secondary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  ></path>
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  ></path>
                </svg>
                Service Status
              </div>
              <div class='collapse-content'>
                <div class='space-y-2 pt-2'>
                  {#each Object.entries(collateralResource.services) as [service, status]}
                    <div
                      class='flex items-center justify-between rounded border border-base-300/40 bg-base-100 p-2 text-sm'
                    >
                      <span class='font-medium capitalize'
                      >{service.replace(/([A-Z])/g, ' $1').trim()}</span
                      >
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
