<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'
  import CollateralPositionDisplayDetailed from '$lib/components/common/CollateralPositionDisplayDetailed.svelte'
  import HealthPill from '$lib/components/common/HealthPill.svelte'
  import { getCdpStore } from '$lib/stores/cdp-store.svelte'
  import { dec, fValue } from '$lib/utils'

  const cdpStore = getCdpStore()

  // Helper to format LTV ratio
  function formatLtv(ltv: number): string {
    if (ltv > 10)
      return '+10'
    return ltv.toFixed(2)
  }

  // Helper to calculate health factor color
  function getHealthColor(ltv: number): string {
    if (ltv <= 0.7)
      return 'text-success'
    if (ltv <= 0.85)
      return 'text-warning'
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

  // Sort CDPs by health LTV (highest first to show riskiest)
  const sortedCdps = $derived.by(() => {
    console.log(cdpStore.filteredCdpList)

    // return cdpStore.filteredCdpList

    if (!cdpStore.filteredCdpList?.length)
      return []

    return [...cdpStore.filteredCdpList].sort((a, b) => b.liquidationLtv.greaterThan(a.liquidationLtv) ? 1 : -1) // Higher LTV = more risky, show first;
  })

  // Modal state
  let showCdpModal = $state(false)
  let selectedCdp = $state<CollateralizeDebtPositionData>(null)

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
      return sum.add(collateral.value).mul(cdpStore.pythPriceStore.xrdPrice)
    }, dec(0))
    return { count, totalValue }
  }

  // Helper to calculate NFT collateral value and wrapper count
  function getNftCollateralInfo(cdp: CollateralizeDebtPositionData): { wrapperCount: number, totalValue: Decimal } {
    const nftPositions = Object.values(cdp.nftCollateralPositions || {})
    const wrapperCount: number = nftPositions.length
    const totalValue = nftPositions.reduce((sum: Decimal, nftPos: any): Decimal => {
      return sum.add((nftPos.value?.value || dec(0)).mul(cdpStore.pythPriceStore.xrdPrice))
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
    return xrdAmount.mul(cdpStore.pythPriceStore.xrdPrice)
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
      return cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.9))
    }).length
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
    <div class='flex justify-center py-12'>
      <div class='loading loading-spinner loading-lg'></div>
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
    <div class='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>Total CDPs</div>
        <div class='stat-value text-2xl'>{sortedCdps.length}</div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>Total Collateral</div>
        <div class='stat-value text-2xl'>
          {fValue(totalCollateralValue)}
        </div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>Total Debt</div>
        <div class='stat-value text-2xl'>
          {fValue(totalDebtValue)}
        </div>
      </div>
      <div class='stat bg-base-200/60 rounded-lg'>
        <div class='stat-title'>At Risk CDPs</div>
        <div class='stat-value text-2xl text-warning'>
          {atRiskCdpCount}
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
                <th class='text-center'>MANAGE</th>
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
                    {fValue(cdp.totalLoanValue.mul(cdpStore.pythPriceStore.xrdPrice))}
                  </td>

                  <!-- Total Collateral -->
                  <td class='text-right font-medium'>
                    {fValue(cdp.totalCollateralValue.mul(cdpStore.pythPriceStore.xrdPrice))}
                  </td>

                  <!-- Health Factor -->
                  <td class='text-center'>
                    <HealthPill ltv={cdp.liquidationLtv} />
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
                            usdValue={dec((loan.value || dec(0)).mul(cdpStore.pythPriceStore.xrdPrice))}
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
                        <span class='font-medium'>{fValue(collateralInfo.totalValue)}</span>
                        <span class='text-xs text-base-content/60'>{collateralInfo.count} position{collateralInfo.count !== 1 ? 's' : ''}</span>
                      </div>
                    {/if}
                  </td>

                  <!-- NFT Value & Wrapper Count -->
                  <td class='text-right'>
                    {#if true}
                      {@const nftInfo = getNftCollateralInfo(cdp)}
                      <div class='flex flex-col'>
                        <span class='font-medium'>{fValue(nftInfo.totalValue)}</span>
                        <span class='text-xs text-base-content/60'>{nftInfo.wrapperCount} wrapper{nftInfo.wrapperCount !== 1 ? 's' : ''}</span>
                      </div>
                    {/if}
                  </td>

                  <!-- Actions -->
                  <td class='text-center'>
                    <a
                      href='/cdp?id={cdp.id}'
                      class='btn btn-xs btn-primary'
                      onclick={e => e.stopPropagation()}
                    >
                      Manage
                    </a>
                  </td>
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
              <div class='stat-value text-lg'>{fValue(selectedCdp.totalLoanValue.mul(cdpStore.pythPriceStore.xrdPrice))}</div>
            </div>
            <div class='stat bg-base-200/60 rounded-lg p-3'>
              <div class='stat-title text-xs'>Total Collateral</div>
              <div class='stat-value text-lg'>{fValue(selectedCdp.totalCollateralValue.mul(cdpStore.pythPriceStore.xrdPrice))}</div>
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
                <HealthPill ltv={selectedCdp.liquidationLtv} />
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
                  <CollateralPositionDisplayDetailed
                    resourceAddress={resourceAddress}
                    amount={dec((loan as any).amount || 0)}
                    usdValue={dec(((loan as any).value || dec(0)).mul(cdpStore.pythPriceStore.xrdPrice))}
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
                  <CollateralPositionDisplayDetailed
                    resourceAddress={resourceAddress}
                    amount={dec((collateral as any).amount || 0)}
                    usdValue={dec(((collateral as any).value || dec(0)).mul(cdpStore.pythPriceStore.xrdPrice))}
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
          <div class='space-y-2 max-h-64 overflow-y-auto'>
            {#if Object.keys(selectedCdp.nftCollateralPositions || {}).length > 0}
              {@const nftUnderlyingCollateral = Object.values(selectedCdp.nftCollateralPositions || {})
                .flatMap((nftPos: any) => Object.entries((nftPos as any).underlyingPositions || {}))}
              {#each nftUnderlyingCollateral as [resourceAddress, collateral]}
                <div class='p-3 bg-base-200/60 rounded-lg'>
                  <CollateralPositionDisplayDetailed
                    resourceAddress={resourceAddress}
                    amount={dec((collateral as any).amount || 0)}
                    usdValue={dec(((collateral as any).value || dec(0)).mul(cdpStore.pythPriceStore.xrdPrice))}
                  />
                </div>
              {/each}
            {:else}
              <div class='text-center text-base-content/60 py-4'>No NFT collateral</div>
            {/if}
          </div>
        </div>
      </div>

      <div class='modal-action'>
        <a href='/cdp?id={selectedCdp.id}' class='btn btn-primary'>Manage CDP</a>
        <button class='btn' onclick={closeCdpModal}>Close</button>
      </div>
    </div>
  </div>
{/if}
