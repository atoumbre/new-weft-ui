<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'
  import CDPHealthPill from '$lib/components/common/CDPHealthPill.svelte'
  import { getCdpStore, inEfficiency } from '$lib/stores/cdp-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fValue } from '$lib/utils'

  const cdpStore = getCdpStore()
  const xrdPriceStore = getXRDPriceStore()

  // Helper to format LTV ratio
  function formatLtv(ltv: number): string {
    if (ltv > 10)
      return '+10'
    return ltv.toFixed(2)
  }

  // Helper to calculate health factor color
  function getHealthColor(ltv: number): string {
    if (ltv <( 0.7 * 1.00))
      return 'text-success'
    if (ltv < ( 0.9 * 1.00))
      return 'text-warning'
    if (ltv < ( 1.0 * 1.00))
      return 'text-error'
    else
      return 'text-error'
  }

  // // Helper to format currency values
  // function formatCurrency(value: number): string {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   }).format(value);
  // }

  // Sort CDPs by health LTV and apply filters
  const sortedCdps = $derived.by(() => {
    if (!cdpStore.filteredCdpList?.length)
      return []

    let filteredList = [...cdpStore.filteredCdpList]

    // Apply risky CDP filter
    if (showOnlyRiskyCdps) {
      filteredList = filteredList.filter(cdp =>
        cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.00)) && !inEfficiency(cdp)
      )
    }

    // Sort by loan resource amount or default LTV sorting
    if (sortByLoanResource && selectedLoanResource) {
      return filteredList.sort((a, b) => {
        const aAmount = dec((a.loanPositions[selectedLoanResource] as any)?.amount || 0)
        const bAmount = dec((b.loanPositions[selectedLoanResource] as any)?.amount || 0)
        return bAmount.comparedTo(aAmount) // Highest amount first
      })
    } else {
      // Default sort by liquidation LTV (highest first to show riskiest)
      return filteredList.sort((a, b) => b.liquidationLtv.greaterThan(a.liquidationLtv) ? 1 : -1)
    }
  })

  // Modal state
  let showCdpModal = $state(false)
  let selectedCdp = $state<CollateralizeDebtPositionData|null>(null)

  // Filter state
  let showOnlyRiskyCdps = $state(true)

  // Sort state
  let sortByLoanResource = $state(false)
  let selectedLoanResource = $state('')
  let showLoanResourceMenu = $state(false)

  // Get selected resource data for display
  const selectedResourceData = $derived.by(() => {
    if (!selectedLoanResource) return null
    return dropdownLoanResources.find(item => item.resourceAddress === selectedLoanResource)
  })

  // Handle resource selection
  function selectResource(resourceAddress: string) {
    selectedLoanResource = resourceAddress
    showLoanResourceMenu = false
  }

  // Close menu when clicking outside
  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement
    if (!target.closest('.dropdown')) {
      showLoanResourceMenu = false
    }
  }

  // Add click outside handler
  $effect(() => {
    if (showLoanResourceMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  })

  // Clear selected resource if it's no longer available in filtered set
  $effect(() => {
    if (selectedLoanResource && !dropdownLoanResources.some(item => item.resourceAddress === selectedLoanResource)) {
      selectedLoanResource = ''
    }
  })


  // Breakdown modal states
  let showCollateralBreakdown = $state(false)
  let showDebtBreakdown = $state(false)
  let showRiskyDebtBreakdown = $state(false)

  function showCdpDetails(cdp: any) {
    selectedCdp = cdp
    showCdpModal = true
  }

  function closeCdpModal() {
    showCdpModal = false
    selectedCdp = null
  }

  // Helper to calculate fungible collateral value and count
  function getFungibleCollateralInfo(cdp: CollateralizeDebtPositionData): { count: number, totalValue: Decimal } {
    const positions = Object.entries(cdp.collateralPositions || {})
    const count = positions.length
    const totalValue = positions.reduce((sum: Decimal, [_, collateral]) => {
      return sum.add(collateral.value).mul(xrdPriceStore.xrdPrice)
    }, dec(0))
    return { count, totalValue }
  }

  // Helper to calculate NFT collateral value and wrapper count
  function getNftCollateralInfo(cdp: CollateralizeDebtPositionData): { wrapperCount: number, totalValue: Decimal } {
    const nftPositions = Object.values(cdp.nftCollateralPositions || {})
    const wrapperCount: number = nftPositions.length
    const totalValue = nftPositions.reduce((sum: Decimal, nftPos: any): Decimal => {
      return sum.add((nftPos.value?.value || dec(0)).mul(xrdPriceStore.xrdPrice))
    }, dec(0))
    return { wrapperCount, totalValue }
  }

  // Helper methods to access CDP data
  function getCdpById(id: string) {
    return cdpStore.filteredCdpList.find(cdp => cdp.id === id)
  }

  const totalCdpCount = $derived(cdpStore.filteredCdpList.length)

  // Convert XRD values to USD
  function convertXrdToUsd(xrdAmount: Decimal): Decimal {
    return xrdAmount.mul(xrdPriceStore.xrdPrice)
  }

  const totalCollateralValue = $derived.by(() => {
    return cdpStore.filteredCdpList.reduce((sum, cdp) => {
      const collateralValue = convertXrdToUsd(cdp.totalCollateralValue || dec(0))
      return sum.add(collateralValue)
    }, dec(0))
  })

  const totalDebtValue = $derived.by(() => {
    return cdpStore.filteredCdpList.reduce((sum, cdp) =>
      sum.add(convertXrdToUsd(cdp.totalLoanValue || dec(0))), dec(0))
  })

  const atRiskCdpCount = $derived.by(() => {
    return cdpStore.filteredCdpList.filter((cdp) => {
      return cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.00)) && !inEfficiency(cdp)
    }).length
  })

  const atRiskLoanAmount = $derived.by(() => {
    return cdpStore.filteredCdpList.filter((cdp) => {
      return cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.00)) && !inEfficiency(cdp)
    }).reduce((sum, cdp) =>
      sum.add(convertXrdToUsd(cdp.totalLoanValue || dec(0))), dec(0))
  })

  // Resource breakdown calculations
  const collateralBreakdown = $derived.by(() => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList.forEach(cdp => {
      // Fungible collateral
      Object.entries(cdp.collateralPositions || {}).forEach(([resourceAddress, collateral]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add(collateral.amount || dec(0)),
          value: current.value.add(convertXrdToUsd(collateral.value || dec(0)))
        })
      })

      // NFT collateral underlying positions
      Object.values(cdp.nftCollateralPositions || {}).forEach((nftPos: any) => {
        Object.entries(nftPos.underlyingPositions || {}).forEach(([resourceAddress, collateral]) => {
          const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
          breakdown.set(resourceAddress, {
            amount: current.amount.add((collateral as any).amount || dec(0)),
            value: current.value.add(convertXrdToUsd((collateral as any).value || dec(0)))
          })
        })
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const debtBreakdown = $derived.by(() => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList.forEach(cdp => {
      Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add((loan as any).amount || dec(0)),
          value: current.value.add(convertXrdToUsd((loan as any).value || dec(0)))
        })
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  // Adaptive loan resources for dropdown (filtered by risky CDPs if enabled)
  const dropdownLoanResources = $derived.by(() => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    // Use the same filter logic as sortedCdps
    let cdpsToAnalyze = [...cdpStore.filteredCdpList]
    if (showOnlyRiskyCdps) {
      cdpsToAnalyze = cdpsToAnalyze.filter(cdp =>
        cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.8)) && !inEfficiency(cdp)
      )
    }

    cdpsToAnalyze.forEach(cdp => {
      Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add((loan as any).amount || dec(0)),
          value: current.value.add(convertXrdToUsd((loan as any).value || dec(0)))
        })
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const riskyDebtBreakdown = $derived.by(() => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList
      .filter(cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.8)) && !inEfficiency(cdp))
      .forEach(cdp => {
        Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
          const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
          breakdown.set(resourceAddress, {
            amount: current.amount.add((loan as any).amount || dec(0)),
            value: current.value.add(convertXrdToUsd((loan as any).value || dec(0)))
          })
        })
      })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })


</script>

<svelte:head>
  <title>CDP Explorer - Weft</title>
</svelte:head>

<div class='container mx-auto px-4 py-8 space-y-6'>
  <div class='flex items-center justify-between'>
    <div>
      <h1 class='text-3xl font-bold mb-2'>CDP Explorer</h1>
      <p class='text-base-content/70'>Overview of all Collateralized Debt Positions</p>
    </div>
    <div class='flex gap-2'>
      <button class='btn btn-outline btn-sm' onclick={() => cdpStore.loadCdpData()}>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if cdpStore.loading}
    <div class='flex flex-col items-center justify-center py-12 space-y-4'>
      {#if cdpStore.cdpLoadingState}
        <!-- Circular Progress Indicator with Progress -->
        {@const progress = cdpStore.cdpLoadingState.total > 0 ? (cdpStore.cdpLoadingState.loaded / cdpStore.cdpLoadingState.total) * 100 : 0}
        <div class='relative'>
          <div class='radial-progress text-primary' style='--value:{progress}; --size:6rem; --thickness: 4px;' role='progressbar' aria-valuenow={progress} aria-valuemin='0' aria-valuemax='100'>
            <span class='text-sm font-medium'>{Math.round(progress)}%</span>
          </div>
        </div>
        <div class='text-center'>
          <div class='text-base font-medium'>Loading CDPs...</div>
          <div class='text-sm text-base-content/70'>
            {cdpStore.cdpLoadingState.loaded} of {cdpStore.cdpLoadingState.total} loaded
          </div>
        </div>
      {:else}
        <!-- Fallback Spinner -->
        <div class='loading loading-spinner loading-lg'></div>
        <div class='text-base font-medium'>Initializing CDP loading...</div>
      {/if}
    </div>
  {/if}

  <!-- Error State -->
  {#if cdpStore.error}
    <div class='alert alert-error'>
      <svg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6 shrink-0 stroke-current' fill='none' viewBox='0 0 24 24'>
        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
      <span>Error loading CDPs: {cdpStore.error.message}</span>
      <div>
        <button class='btn btn-sm btn-outline' onclick={() => cdpStore.retry()}>Retry</button>
      </div>
    </div>
  {/if}

  <!-- CDP Statistics -->
  {#if !cdpStore.loading && sortedCdps.length > 0}
    <div class='grid grid-cols-1 md:grid-cols-5 gap-4'>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>Total CDPs</div>
        <div class='stat-value text-xl'>{cdpStore.filteredCdpList.length}</div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors' onclick={() => showCollateralBreakdown = true} onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (showCollateralBreakdown = true)} tabindex='0' role='button' aria-label='View total collateral breakdown'>
        <div class='stat-title'>Total Collateral</div>
        <div class='stat-value text-xl'>
          {fValue(totalCollateralValue)}
        </div>
        <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors' onclick={() => showDebtBreakdown = true} onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (showDebtBreakdown = true)} tabindex='0' role='button' aria-label='View total debt breakdown'>
        <div class='stat-title'>Total Debt</div>
        <div class='stat-value text-xl'>
          {fValue(totalDebtValue)}
        </div>
        <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
      </div>   
         <div class='stat bg-base-200/60 rounded-lg cursor-pointer hover:bg-base-300/60 transition-colors' onclick={() => showRiskyDebtBreakdown = true} onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (showRiskyDebtBreakdown = true)} tabindex='0' role='button' aria-label='View total risky debt breakdown'>
        <div class='stat-title'>Total Risky  Debt</div>
        <div class='stat-value text-xl text-warning'>
          {fValue(atRiskLoanAmount)}
        </div>
        <div class='stat-desc text-xs opacity-60'>Click for breakdown</div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>At Risk CDPs</div>
        <div class='stat-value text-2xl text-warning'>
          {atRiskCdpCount}
        </div>
      </div>
    </div>
  {/if}

  <!-- Filter and Sort Controls -->
  {#if !cdpStore.loading && cdpStore.filteredCdpList.length > 0}
    <div class='card bg-base-200/60'>
      <div class='card-body py-4'>
        <div class='space-y-4'>
          <h3 class='font-semibold'>Filters & Sort</h3>

          <div class='flex flex-col md:flex-row md:items-center gap-4'>
            <!-- Risky CDP Toggle -->
            <div class='form-control'>
              <label class='label cursor-pointer gap-2'>
                <span class='label-text text-sm'>Show only risky CDPs</span>
                <input
                  type='checkbox'
                  class='toggle toggle-warning toggle-sm'
                  bind:checked={showOnlyRiskyCdps}
                />
              </label>
            </div>

            <!-- Sort by Loan Resource Toggle -->
            <div class='form-control'>
              <label class='label cursor-pointer gap-2'>
                <span class='label-text text-sm'>Sort by loan resource</span>
                <input
                  type='checkbox'
                  class='toggle toggle-primary toggle-sm'
                  bind:checked={sortByLoanResource}
                  onchange={() => {
                    if (!sortByLoanResource) {
                      selectedLoanResource = ''
                    }
                  }}
                />
              </label>
            </div>

            <!-- Loan Resource Dropdown -->
            {#if sortByLoanResource}
              <div class='dropdown' class:dropdown-open={showLoanResourceMenu}>
                <!-- Dropdown Button -->
                <div
                  tabindex='0'
                  role='button'
                  class='btn btn-outline btn-sm w-full md:min-w-64 justify-start'
                  onclick={() => showLoanResourceMenu = !showLoanResourceMenu}
                  onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (showLoanResourceMenu = !showLoanResourceMenu)}
                >
                  {#if selectedResourceData}
                    <CollateralPositionDisplay
                      resourceAddress={selectedResourceData.resourceAddress}
                      amount={selectedResourceData.amount}
                      usdValue={selectedResourceData.value}
                    />
                  {:else}
                    <span class='text-base-content/60'>Select loan resource...</span>
                  {/if}
                  <svg class='w-4 h-4 ml-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'></path>
                  </svg>
                </div>

                <!-- Dropdown Menu -->
                {#if showLoanResourceMenu}
                  <ul class='dropdown-content menu bg-base-100 rounded-box z-50 w-full md:w-80 p-2 shadow-lg border border-base-300'>
                    {#each dropdownLoanResources as {resourceAddress, amount, value}}
                      <li>
                        <button
                          class='w-full text-left p-3 hover:bg-base-200 rounded-lg'
                          onclick={() => selectResource(resourceAddress)}
                        >
                          <div class='flex items-center justify-between w-full'>
                            <CollateralPositionDisplay
                              {resourceAddress}
                              {amount}
                              usdValue={value}
                            />
                            <div class='text-xs text-base-content/60 ml-2'>
                              {((value.div(dropdownLoanResources.reduce((sum, item) => sum.add(item.value), dec(0)))).mul(100)).toFixed(1)}%
                            </div>
                          </div>
                        </button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- CDP Table -->
  {#if !cdpStore.loading && sortedCdps.length > 0}
    <div class='card bg-base-200/60'>
      <div class='card-body p-0'>
        <div class='overflow-x-auto'>
          <table class='table table-zebra table-sm'>
            <thead>
              <tr class='border-base-300'>
                <th class='text-left'>CDP</th>
                <th class='text-center'>LIQ. LTV</th>
                <th class='text-right'>TOT. LOAN</th>
                <th class='text-right'>TOT. COLL.</th>
                <th class='text-center'>HEALTH</th>
                <th class='text-left'>LOAN POSITIONS</th>
                <th class='text-right'>COLL. VALUE</th>
                <th class='text-right'>NFT VALUE</th>
                <!-- <th class='text-center'>MANAGE</th> -->
              </tr>
            </thead>
            <tbody>
              {#each sortedCdps as cdp}
                <tr class='hover:bg-base-300/50 cursor-pointer' onclick={() => showCdpDetails(cdp)} onkeydown={e => (e.key === 'Enter' || e.key === ' ') && showCdpDetails(cdp)} tabindex='0' role='button' aria-label='View CDP {cdp.id} details'>
                  <!-- CDP ID -->
                  <td class='font-mono font-medium'>
                    <span class='text-primary'>
                      {cdp.id || 'N/A'}
                    </span>
                  </td>

                  <!-- Liquidation LTV -->
                  <td class='text-center'>
                    <span class='font-medium {getHealthColor(cdp.liquidationLtv?.toNumber() || 0)}'>
                      {cdp.liquidationLtv ? formatLtv(cdp.liquidationLtv.toNumber()) : '-'}
                    </span>
                  </td>

                  <!-- Total Loan -->
                  <td class='text-right font-medium'>
                    {fValue(cdp.totalLoanValue.mul(xrdPriceStore.xrdPrice),{fullPrecision:false})}
                  </td>

                  <!-- Total Collateral -->
                  <td class='text-right font-medium'>
                    {fValue(cdp.totalCollateralValue.mul(xrdPriceStore.xrdPrice),{fullPrecision:false})}
                  </td>

                  <!-- Health Factor -->
                  <td class='text-center'>
                    <CDPHealthPill {cdp} />
                  </td>

                  <!-- Loan Positions -->
                  <td>
                    <div class='space-y-1'>
                      {#if Object.keys(cdp.loanPositions || {}).length > 0}
                        {@const loanEntries = Object.entries(cdp.loanPositions || {}).slice(0, 2)}
                        {#each loanEntries as [resourceAddress, loan]}
                          <CollateralPositionDisplay
                            resourceAddress={resourceAddress}
                            amount={dec(loan.amount || 0)}
                            usdValue={dec((loan.value || dec(0)).mul(xrdPriceStore.xrdPrice))}
                          />
                        {/each}
                        {#if Object.keys(cdp.loanPositions || {}).length > 2}
                          <div class='text-xs text-base-content/60'>
                            +{Object.keys(cdp.loanPositions || {}).length - 2} more
                          </div>
                        {/if}
                      {:else}
                        <span class='text-base-content/60'>No loans</span>
                      {/if}
                    </div>
                  </td>

                  <!-- Collateral Value & Count -->
                  <td class='text-right'>
                    {#if true}
                      {@const collateralInfo = getFungibleCollateralInfo(cdp)}
                      <div class='flex flex-col'>
                        <span class='font-medium'>{fValue(collateralInfo.totalValue,{fullPrecision:false})}</span>
                        <span class='text-xs text-base-content/60'>{collateralInfo.count} position{collateralInfo.count !== 1 ? 's' : ''}</span>
                      </div>
                    {/if}
                  </td>

                  <!-- NFT Value & Wrapper Count -->
                  <td class='text-right'>
                    {#if true}
                      {@const nftInfo = getNftCollateralInfo(cdp)}
                      <div class='flex flex-col'>
                        <span class='font-medium'>{fValue(nftInfo.totalValue,{fullPrecision:false})}</span>
                        <span class='text-xs text-base-content/60'>{nftInfo.wrapperCount} wrapper{nftInfo.wrapperCount !== 1 ? 's' : ''}</span>
                      </div>
                    {/if}
                  </td>

                  <!-- Actions -->
                  <!-- <td class='text-center'>
                    <a
                      href='/cdp?id={cdp.id}'
                      class='btn btn-xs btn-primary'
                      onclick={e => e.stopPropagation()}
                    >
                      Manage
                    </a>
                  </td> -->
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {:else if !cdpStore.loading}
    <div class='text-center py-12'>
      <div class='text-base-content/60 mb-4'>No CDPs found</div>
    </div>
  {/if}
</div>

<!-- CDP Details Modal -->
{#if showCdpModal && selectedCdp}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class='modal modal-open' role='dialog' aria-labelledby='cdp-modal-title' tabindex='-1' onclick={closeCdpModal} onkeydown={e => e.key === 'Escape' && closeCdpModal()}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class='modal-box max-w-4xl' role='document' onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>
      <div class='flex justify-between items-center mb-4'>
        <h3 id='cdp-modal-title' class='font-bold text-lg'>CDP Details - {selectedCdp.id}</h3>
        <button class='btn btn-sm btn-circle btn-ghost' onclick={closeCdpModal}>✕</button>
      </div>

      <div class='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <!-- CDP Overview -->
        <div class='space-y-4'>
          <h4 class='font-semibold text-base border-b pb-2'>Overview</h4>

          <div class='grid grid-cols-2 gap-4'>
            <div class='stat bg-base-200/60 rounded-lg p-3'>
              <div class='stat-title text-xs'>Total Loan</div>
              <div class='stat-value text-lg'>{fValue(selectedCdp.totalLoanValue.mul(xrdPriceStore.xrdPrice))}</div>
            </div>
            <div class='stat bg-base-200/60 rounded-lg p-3'>
              <div class='stat-title text-xs'>Total Collateral</div>
              <div class='stat-value text-lg'>{fValue(selectedCdp.totalCollateralValue.mul(xrdPriceStore.xrdPrice))}</div>
            </div>
            <div class='stat bg-base-200/60 rounded-lg p-3'>
              <div class='stat-title text-xs'>Liquidation LTV</div>
              <div class='stat-value text-lg {getHealthColor(selectedCdp.liquidationLtv?.toNumber() || 0)}'>
                {selectedCdp.liquidationLtv ? formatLtv(selectedCdp.liquidationLtv.toNumber()) : '-'}
              </div>
            </div>
            <div class='stat bg-base-200/60 rounded-lg p-3'>
              <div class='stat-title text-xs'>Health Factor</div>
              <div class='stat-value text-lg'>
                <CDPHealthPill cdp={selectedCdp} />
              </div>
            </div>
          </div>
        </div>

        <!-- Loan Positions -->
        <div class='space-y-4'>
          <h4 class='font-semibold text-base border-b pb-2'>Loan Positions</h4>
          <div class='space-y-2 max-h-64 overflow-y-auto'>
            {#if Object.keys(selectedCdp.loanPositions || {}).length > 0}
              {#each Object.entries(selectedCdp.loanPositions || {}) as [resourceAddress, loan]}
                <div class='p-3 bg-base-200/60 rounded-lg'>
                  <CollateralPositionDisplay
                    resourceAddress={resourceAddress}
                    amount={dec((loan as any).amount || 0)}
                    usdValue={dec(((loan as any).value || dec(0)).mul(xrdPriceStore.xrdPrice))}
                  />
                </div>
              {/each}
            {:else}
              <div class='text-center text-base-content/60 py-4'>No loan positions</div>
            {/if}
          </div>
        </div>

        <!-- Collateral Positions -->
        <div class='space-y-4'>
          <h4 class='font-semibold text-base border-b pb-2'>Collateral Positions</h4>
          <div class='space-y-2 max-h-64 overflow-y-auto'>
            {#if Object.keys(selectedCdp.collateralPositions || {}).length > 0}
              {#each Object.entries(selectedCdp.collateralPositions || {}) as [resourceAddress, collateral]}
                <div class='p-3 bg-base-200/60 rounded-lg'>
                  <CollateralPositionDisplay
                    resourceAddress={resourceAddress}
                    amount={dec((collateral as any).amount || 0)}
                    usdValue={dec(((collateral as any).value || dec(0)).mul(xrdPriceStore.xrdPrice))}
                  />
                </div>
              {/each}
            {:else}
              <div class='text-center text-base-content/60 py-4'>No collateral positions</div>
            {/if}
          </div>
        </div>

        <!-- NFT Collateral Positions -->
        <div class='space-y-4'>
          <h4 class='font-semibold text-base border-b pb-2'>NFT Collateral</h4>
          <div class='space-y-3 max-h-64 overflow-y-auto'>
            {#if Object.keys(selectedCdp.nftCollateralPositions || {}).length > 0}
              {#each Object.entries(selectedCdp.nftCollateralPositions || {}) as [wrapperId, nftPos]}
                <div class='border border-base-300 rounded-lg p-3 bg-base-100/50'>
                  <!-- Wrapper ID Header -->
                  <div class='mb-3'>
                    <div class='font-mono text-sm font-medium text-primary'>
                      ID: {wrapperId.slice(-7, -1)}
                    </div>
                  </div>

                  <!-- Underlying Positions -->
                  <div class='space-y-2'>
                    {#each Object.entries((nftPos as any).underlyingPositions || {}) as [resourceAddress, collateral]}
                      <div class='p-2 bg-base-200/40 rounded'>
                        <CollateralPositionDisplay
                          resourceAddress={resourceAddress}
                          amount={dec((collateral as any).amount || 0)}
                          usdValue={dec(((collateral as any).value || dec(0)).mul(xrdPriceStore.xrdPrice))}
                        />
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            {:else}
              <div class='text-center text-base-content/60 py-4'>No NFT collateral</div>
            {/if}
          </div>
        </div>
      </div>

      <div class='modal-action'>
        <!-- <a href='/cdp?id={selectedCdp.id}' class='btn btn-primary'>Manage CDP</a> -->
        <button class='btn' onclick={closeCdpModal}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Collateral Breakdown Modal -->
{#if showCollateralBreakdown}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class='modal modal-open' role='dialog' tabindex='-1' onclick={() => showCollateralBreakdown = false} onkeydown={e => e.key === 'Escape' && (showCollateralBreakdown = false)}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class='modal-box max-w-2xl' role='document' onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>
      <div class='flex justify-between items-center mb-4'>
        <h3 class='font-bold text-lg'>Total Collateral Breakdown</h3>
        <button class='btn btn-sm btn-circle btn-ghost' onclick={() => showCollateralBreakdown = false}>✕</button>
      </div>

      <div class='space-y-3 max-h-96 overflow-y-auto'>
        {#each collateralBreakdown as {resourceAddress, amount, value}}
          <div class='flex items-center justify-between p-3 bg-base-200/60 rounded-lg'>
            <div class='flex-1'>
              <CollateralPositionDisplay
                {resourceAddress}
                {amount}
                usdValue={value}
              />
            </div>
            <div class='text-right'>
              <div class='font-medium'>{fValue(value)}</div>
              <div class='text-xs opacity-60'>{((value.div(totalCollateralValue)).mul(100)).toFixed(1)}%</div>
            </div>
          </div>
        {/each}
        {#if collateralBreakdown.length === 0}
          <div class='text-center py-8 text-base-content/60'>No collateral data available</div>
        {/if}
      </div>

      <div class='modal-action'>
        <button class='btn' onclick={() => showCollateralBreakdown = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Debt Breakdown Modal -->
{#if showDebtBreakdown}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class='modal modal-open' role='dialog' tabindex='-1' onclick={() => showDebtBreakdown = false} onkeydown={e => e.key === 'Escape' && (showDebtBreakdown = false)}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class='modal-box max-w-2xl' role='document' onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>
      <div class='flex justify-between items-center mb-4'>
        <h3 class='font-bold text-lg'>Total Debt Breakdown</h3>
        <button class='btn btn-sm btn-circle btn-ghost' onclick={() => showDebtBreakdown = false}>✕</button>
      </div>

      <div class='space-y-3 max-h-96 overflow-y-auto'>
        {#each debtBreakdown as {resourceAddress, amount, value}}
          <div class='flex items-center justify-between p-3 bg-base-200/60 rounded-lg'>
            <div class='flex-1'>
              <CollateralPositionDisplay
                {resourceAddress}
                {amount}
                usdValue={value}
              />
            </div>
            <div class='text-right'>
              <div class='font-medium'>{fValue(value)}</div>
              <div class='text-xs opacity-60'>{((value.div(totalDebtValue)).mul(100)).toFixed(1)}%</div>
            </div>
          </div>
        {/each}
        {#if debtBreakdown.length === 0}
          <div class='text-center py-8 text-base-content/60'>No debt data available</div>
        {/if}
      </div>

      <div class='modal-action'>
        <button class='btn' onclick={() => showDebtBreakdown = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Risky Debt Breakdown Modal -->
{#if showRiskyDebtBreakdown}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class='modal modal-open' role='dialog' tabindex='-1' onclick={() => showRiskyDebtBreakdown = false} onkeydown={e => e.key === 'Escape' && (showRiskyDebtBreakdown = false)}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class='modal-box max-w-2xl' role='document' onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>
      <div class='flex justify-between items-center mb-4'>
        <h3 class='font-bold text-lg'>Total Risky Debt Breakdown</h3>
        <button class='btn btn-sm btn-circle btn-ghost' onclick={() => showRiskyDebtBreakdown = false}>✕</button>
      </div>

      <div class='space-y-3 max-h-96 overflow-y-auto'>
        {#each riskyDebtBreakdown as {resourceAddress, amount, value}}
          <div class='flex items-center justify-between p-3 bg-base-200/60 rounded-lg'>
            <div class='flex-1'>
              <CollateralPositionDisplay
                {resourceAddress}
                {amount}
                usdValue={value}
              />
            </div>
            <div class='text-right'>
              <div class='font-medium text-warning'>{fValue(value)}</div>
              <div class='text-xs opacity-60'>{((value.div(atRiskLoanAmount)).mul(100)).toFixed(1)}%</div>
            </div>
          </div>
        {/each}
        {#if riskyDebtBreakdown.length === 0}
          <div class='text-center py-8 text-base-content/60'>No risky debt data available</div>
        {/if}
      </div>

      <div class='modal-action'>
        <button class='btn' onclick={() => showRiskyDebtBreakdown = false}>Close</button>
      </div>
    </div>
  </div>
{/if}
