<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import { getCdpStore, inEfficiency } from '$lib/stores/cdp-store.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec } from '$lib/utils/common'
  import {
    CDP_HEALTH_DEFINITIONS,
    getCdpHealthTextClass,
    resolveCdpHealthDefinition,
  } from '$lib/utils/health'
  import { onMount } from 'svelte'
  import BreakdownModal from '../../lib/components/common/BreakdownModal.svelte'
  import CdpBreakdownModal from './components/CdpBreakdownModal.svelte'
  import CdpDetailsModal from './components/CdpDetailsModal.svelte'
  import CdpTable from './components/CdpTable.svelte'
  import FiltersPanel from './components/FiltersPanel.svelte'
  import HeaderSection from './components/HeaderSection.svelte'
  import StatsGrid from './components/StatsGrid.svelte'

  type ResourceAggregation = {
    resourceAddress: string
    amount: Decimal
    value: Decimal
  }

  const cdpStore = getCdpStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()
  const marketInfoStore = getMarketInfoStore()

  let showCollateralBreakdown = $state(false)
  let showDebtBreakdown = $state(false)
  let showRiskyDebtBreakdown = $state(false)
  let showCdpHealthBreakdown = $state(false)
  let showAtRiskCdpBreakdown = $state(false)
  let showCdpModal = $state(false)
  let selectedCdp = $state<CollateralizeDebtPositionData | null>(null)
  let showOnlyRiskyCdps = $state(true)
  let sortByLoanResource = $state(false)
  let selectedLoanResource = $state('')

  const dropdownLoanResources = $derived.by((): ResourceAggregation[] => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    let cdpsToAnalyze = [...cdpStore.filteredCdpList]
    if (showOnlyRiskyCdps) {
      cdpsToAnalyze = cdpsToAnalyze.filter(
        cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.8)) && !inEfficiency(cdp),
      )
    }

    cdpsToAnalyze.forEach((cdp) => {
      Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add((loan as any).amount || dec(0)),
          value: current.value.add(convertXrdToUsd((loan as any).value)),
        })
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const sortedCdps = $derived.by((): CollateralizeDebtPositionData[] => {
    if (!cdpStore.filteredCdpList?.length)
      return [] as CollateralizeDebtPositionData[]

    let filteredList = [...cdpStore.filteredCdpList]

    if (showOnlyRiskyCdps) {
      filteredList = filteredList.filter(
        cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.0)) && !inEfficiency(cdp),
      )
    }

    if (sortByLoanResource && selectedLoanResource) {
      return filteredList.sort((a, b) => {
        const aAmount = dec((a.loanPositions[selectedLoanResource] as any)?.amount || 0)
        const bAmount = dec((b.loanPositions[selectedLoanResource] as any)?.amount || 0)
        return bAmount.comparedTo(aAmount)
      })
    }

    return filteredList.sort((a, b) => (b.liquidationLtv.greaterThan(a.liquidationLtv) ? 1 : -1))
  })

  const selectedResourceData = $derived.by((): ResourceAggregation | null => {
    if (!selectedLoanResource)
      return null
    return (
      dropdownLoanResources.find(item => item.resourceAddress === selectedLoanResource) ?? null
    )
  })

  const totalCollateralValue = $derived.by(() =>
    cdpStore.filteredCdpList.reduce(
      (sum, cdp) => sum.add(convertXrdToUsd(cdp.totalCollateralValue)),
      dec(0),
    ),
  )

  const totalDebtValue = $derived.by(() =>
    cdpStore.filteredCdpList.reduce(
      (sum, cdp) => sum.add(convertXrdToUsd(cdp.totalLoanValue)),
      dec(0),
    ),
  )

  const atRiskCdpCount = $derived.by(
    () =>
      cdpStore.filteredCdpList.filter(
        cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.0)) && !inEfficiency(cdp),
      ).length,
  )

  const atRiskLoanAmount = $derived.by(() =>
    cdpStore.filteredCdpList
      .filter(
        cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7 * 1.0)) && !inEfficiency(cdp),
      )
      .reduce((sum, cdp) => sum.add(convertXrdToUsd(cdp.totalLoanValue)), dec(0)),
  )

  const collateralBreakdown = $derived.by((): ResourceAggregation[] => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList.forEach((cdp) => {
      Object.entries(cdp.collateralPositions || {}).forEach(([resourceAddress, collateral]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add(collateral.amount || dec(0)),
          value: current.value.add(convertXrdToUsd(collateral.value as Decimal | undefined)),
        })
      })

      Object.values(cdp.nftCollateralPositions || {}).forEach((nftPos: any) => {
        Object.entries(nftPos.underlyingPositions || {}).forEach(
          ([resourceAddress, collateral]) => {
            const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
            breakdown.set(resourceAddress, {
              amount: current.amount.add((collateral as any).amount || dec(0)),
              value: current.value.add(convertXrdToUsd((collateral as any).value)),
            })
          },
        )
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const debtBreakdown = $derived.by((): ResourceAggregation[] => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList.forEach((cdp) => {
      Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
        const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
        breakdown.set(resourceAddress, {
          amount: current.amount.add((loan as any).amount || dec(0)),
          value: current.value.add(convertXrdToUsd((loan as any).value)),
        })
      })
    })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const dropdownLoanResourcesTotalValue = $derived.by(() =>
    dropdownLoanResources.reduce((sum, item) => sum.add(item.value), dec(0)),
  )

  const riskyDebtBreakdown = $derived.by((): ResourceAggregation[] => {
    const breakdown = new Map<string, { amount: Decimal, value: Decimal }>()

    cdpStore.filteredCdpList
      .filter(cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.8)) && !inEfficiency(cdp))
      .forEach((cdp) => {
        Object.entries(cdp.loanPositions || {}).forEach(([resourceAddress, loan]) => {
          const current = breakdown.get(resourceAddress) || { amount: dec(0), value: dec(0) }
          breakdown.set(resourceAddress, {
            amount: current.amount.add((loan as any).amount || dec(0)),
            value: current.value.add(convertXrdToUsd((loan as any).value)),
          })
        })
      })

    return Array.from(breakdown.entries())
      .map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))
  })

  const totalCdpCount = $derived(cdpStore.filteredCdpList.length)

  const cdpHealthBreakdown = $derived.by(() => {
    const total = cdpStore.filteredCdpList.length || 0

    const buckets = [
      ...CDP_HEALTH_DEFINITIONS.map(({ id, label, textClass }) => ({
        id,
        label,
        className: textClass,
        count: 0,
        percentage: 0,
      })),
      {
        id: 'efficiency',
        label: 'Efficiency Mode',
        className: 'text-primary',
        count: 0,
        percentage: 0,
      },
    ]

    const bucketsById = new Map(buckets.map(bucket => [bucket.id, bucket]))

    cdpStore.filteredCdpList.forEach((cdp) => {
      if (inEfficiency(cdp)) {
        const efficiencyBucket = bucketsById.get('efficiency')
        if (efficiencyBucket)
          efficiencyBucket.count += 1
        return
      }

      const definition = resolveCdpHealthDefinition(cdp.liquidationLtv)
      const bucket = bucketsById.get(definition.id)
      if (bucket)
        bucket.count += 1
    })

    return buckets.map(bucket => ({
      ...bucket,
      percentage: total ? (bucket.count / total) * 100 : 0,
    }))
  })

  const atRiskCdpHealthBreakdown = $derived.by(() => {
    const riskyCdps = cdpStore.filteredCdpList.filter(
      cdp => cdp.liquidationLtv.greaterThanOrEqualTo(dec(0.7)) && !inEfficiency(cdp),
    )

    const total = riskyCdps.length || 0

    const buckets = CDP_HEALTH_DEFINITIONS.filter(definition => definition.id !== 'healthy').map(
      ({ id, label, textClass }) => ({
        id,
        label,
        className: textClass,
        count: 0,
        percentage: 0,
      }),
    )

    const bucketMap = new Map(buckets.map(bucket => [bucket.id, bucket]))

    riskyCdps.forEach((cdp) => {
      const definition = resolveCdpHealthDefinition(cdp.liquidationLtv)
      const bucket = bucketMap.get(definition.id)
      if (bucket)
        bucket.count += 1
    })

    return buckets.map(bucket => ({
      ...bucket,
      percentage: total ? (bucket.count / total) * 100 : 0,
    }))
  })

  onMount(() => {
    if (marketInfoStore.status === 'not loaded') {
      marketInfoStore.loadMarketInfo().then(() => {
        priceStore.loadPrices(marketInfoStore.allResourceAddresses)
      })
    }

    if (cdpStore.status === 'not loaded') {
      cdpStore.loadCdpData()
    }
  })

  function convertXrdToUsd(xrdAmount: Decimal | undefined | null) {
    if (!xrdAmount)
      return dec(0)
    return xrdAmount.mul(xrdPriceStore.xrdPrice)
  }

  function formatLtv(ltv: number): string {
    if (ltv > 10)
      return '+10'
    return ltv.toFixed(2)
  }

  function getHealthColor(ltv: number | Decimal): string {
    return getCdpHealthTextClass(ltv)
  }

  function selectResource(resourceAddress: string) {
    selectedLoanResource = resourceAddress
  }

  $effect(() => {
    if (
      selectedLoanResource
      && !dropdownLoanResources.some(item => item.resourceAddress === selectedLoanResource)
    ) {
      selectedLoanResource = ''
    }
  })

  function showCdpDetails(cdp: CollateralizeDebtPositionData) {
    selectedCdp = cdp
    showCdpModal = true
  }

  function closeCdpModal() {
    showCdpModal = false
    selectedCdp = null
  }

</script>

<svelte:head>
  <title>CDP Explorer - Weft</title>
</svelte:head>

<div class='container mx-auto space-y-6 px-4 py-8'>
  <HeaderSection onRefresh={() => cdpStore.loadCdpData()} />

  {#if cdpStore.loading}
    {@const loadingState = cdpStore.cdpLoadingState}
    {@const progress
      = loadingState && loadingState.total > 0 ? (loadingState.loaded / loadingState.total) * 100 : 0}
    <div class='flex flex-col items-center justify-center space-y-4 py-12'>
      <div class='relative'>
        <div
          class='radial-progress text-primary'
          style='--value:{progress}; --size:6rem; --thickness: 4px;'
          role='progressbar'
          aria-valuenow={progress}
          aria-valuemin='0'
          aria-valuemax='100'
        >
          {#if loadingState && loadingState.total > 0}
            <span class='text-sm font-medium'>{Math.round(progress)}%</span>
          {:else}
            <span class='text-sm font-medium'><span class='loading loading-ring loading-md'></span></span>
          {/if}
        </div>
      </div>
      <div class='text-center'>
        <div class='text-base font-medium'>
          {#if loadingState}
            Loading CDPs...
          {:else}
            Initializing CDP loading...
          {/if}
        </div>
        <div class='text-sm text-base-content/70'>
          {#if loadingState}
            {loadingState.loaded} of {loadingState.total} loaded
            <!-- {:else}
            Preparing data sources... -->
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if cdpStore.error}
    <div class='alert alert-error'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        class='h-6 w-6 shrink-0 stroke-current'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          stroke-linecap='round'
          stroke-linejoin='round'
          stroke-width='2'
          d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
      <span>Error loading CDPs: {cdpStore.error.message}</span>
      <div>
        <button class='btn btn-outline btn-sm' onclick={() => cdpStore.retry()}>Retry</button>
      </div>
    </div>
  {/if}

  {#if !cdpStore.loading && sortedCdps.length > 0}
    <StatsGrid
      {totalCollateralValue}
      {totalDebtValue}
      {atRiskLoanAmount}
      {atRiskCdpCount}
      {totalCdpCount}
      onShowCdpHealthBreakdown={() => (showCdpHealthBreakdown = true)}
      onShowAtRiskBreakdown={() => (showAtRiskCdpBreakdown = true)}
      onShowCollateralBreakdown={() => (showCollateralBreakdown = true)}
      onShowDebtBreakdown={() => (showDebtBreakdown = true)}
      onShowRiskyDebtBreakdown={() => (showRiskyDebtBreakdown = true)}
    />
  {/if}

  {#if !cdpStore.loading && cdpStore.filteredCdpList.length > 0}
    <FiltersPanel
      {showOnlyRiskyCdps}
      {sortByLoanResource}
      {dropdownLoanResources}
      {dropdownLoanResourcesTotalValue}
      selectedResource={selectedResourceData}
      onToggleShowOnlyRisky={(value: boolean) => (showOnlyRiskyCdps = value)}
      onToggleSortByLoanResource={(value: boolean) => {
        sortByLoanResource = value
        if (!value)
          selectedLoanResource = ''
      }}
      onSelectResource={selectResource}
    />
  {/if}

  {#if !cdpStore.loading && sortedCdps.length > 0}
    <CdpTable
      cdps={sortedCdps}
      {formatLtv}
      {getHealthColor}
      {xrdPriceStore}
      onSelectCdp={showCdpDetails}
    />
  {:else if !cdpStore.loading}
    <div class='py-12 text-center'>
      <div class='mb-4 text-base-content/60'>No CDPs found</div>
    </div>
  {/if}
</div>

{#if showCdpModal && selectedCdp}
  <CdpDetailsModal
    cdp={selectedCdp}
    onClose={closeCdpModal}
    {formatLtv}
    {getHealthColor}
    xrdPrice={xrdPriceStore.xrdPrice}
  />
{/if}

<BreakdownModal
  title='Total Collateral Breakdown'
  open={showCollateralBreakdown}
  items={collateralBreakdown}
  onClose={() => (showCollateralBreakdown = false)}
/>
<BreakdownModal
  title='Total Debt Breakdown'
  open={showDebtBreakdown}
  items={debtBreakdown}
  onClose={() => (showDebtBreakdown = false)}
/>
<BreakdownModal
  title='Risky Debt Breakdown'
  open={showRiskyDebtBreakdown}
  items={riskyDebtBreakdown}
  onClose={() => (showRiskyDebtBreakdown = false)}
/>

<CdpBreakdownModal
  title='CDP Health Breakdown'
  open={showCdpHealthBreakdown}
  items={cdpHealthBreakdown}
  emptyMessage='No CDPs available'
  percentageLabel='of CDPs'
  onClose={() => (showCdpHealthBreakdown = false)}
/>

<CdpBreakdownModal
  title='At Risk CDP Breakdown'
  open={showAtRiskCdpBreakdown}
  items={atRiskCdpHealthBreakdown}
  emptyMessage='No at-risk CDPs'
  percentageLabel='of at-risk CDPs'
  onClose={() => (showAtRiskCdpBreakdown = false)}
/>
