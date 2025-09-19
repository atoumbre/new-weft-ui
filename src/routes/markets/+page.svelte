<script lang='ts'>
  import type Decimal from 'decimal.js'
  import CollateralsSection from './components/CollateralsSection.svelte'
  import LendingPoolsSection from './components/LendingPoolsSection.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import MarketsHeader from './components/MarketsHeader.svelte'
  import MarketsStats from './components/MarketsStats.svelte'
  import BreakdownModal from '../../lib/components/common/BreakdownModal.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec } from '$lib/utils'
  import { onMount } from 'svelte';

  type LendingTotals = {
    totalSupplied: Decimal
    totalBorrowed: Decimal
    totalLiquidity: Decimal
  }

  type CollateralTotals = {
    totalDepositUSD: Decimal
    totalDepositUnderDUUSD: Decimal
    total: Decimal
  }

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

  onMount(()=>{
    if (marketInfoStore.status==='not loaded')   {
      marketInfoStore.loadMarketInfo().then(() => {
        priceStore.loadPrices(marketInfoStore.allResourceAddresses)
      })
    }
  })
  


  let activeTab = $state<'lending' | 'collaterals'>('lending')
  let showSuppliedBreakdown = $state(false)
  let showBorrowedBreakdown = $state(false)
  let showLiquidityBreakdown = $state(false)
  let showCollateralBreakdownModal = $state(false)

  const enhanceBreakdown = (map: Map<string, { amount: Decimal; value: Decimal }>) =>
    Array.from(map.entries()).map(([resourceAddress, data]) => ({ resourceAddress, ...data }))
      .sort((a, b) => b.value.comparedTo(a.value))

  const addToBreakdown = (
    map: Map<string, { amount: Decimal; value: Decimal }>,
    resourceAddress: string,
    amount: Decimal,
    value: Decimal,
  ) => {
    const current = map.get(resourceAddress) || { amount: dec(0), value: dec(0) }
    map.set(resourceAddress, {
      amount: current.amount.add(amount),
      value: current.value.add(value),
    })
  }

  const lendingSummary = $derived.by(() => {
    const totals: LendingTotals = {
      totalSupplied: dec(0),
      totalBorrowed: dec(0),
      totalLiquidity: dec(0),
    }

    const suppliedBreakdownMap = new Map<string, { amount: Decimal; value: Decimal }>()
    const borrowedBreakdownMap = new Map<string, { amount: Decimal; value: Decimal }>()
    const liquidityBreakdownMap = new Map<string, { amount: Decimal; value: Decimal }>()

    marketInfoStore.loanResources.forEach((loanResource) => {
      const { current: priceInXRD } = priceStore.getPrice(loanResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
      const pool = loanResource.lendingPoolState

      if (!pool)
        return

      const suppliedUSD = pool.totalDeposit.mul(priceInUSD)
      const borrowedUSD = pool.totalLoan.mul(priceInUSD)
      const liquidityAmount = pool.totalDeposit.sub(pool.totalLoan)
      const liquidityUSD = liquidityAmount.mul(priceInUSD)

      totals.totalSupplied = totals.totalSupplied.add(suppliedUSD)
      totals.totalBorrowed = totals.totalBorrowed.add(borrowedUSD)
      totals.totalLiquidity = totals.totalLiquidity.add(liquidityUSD)

      addToBreakdown(suppliedBreakdownMap, loanResource.resourceAddress, pool.totalDeposit, suppliedUSD)
      addToBreakdown(borrowedBreakdownMap, loanResource.resourceAddress, pool.totalLoan, borrowedUSD)
      addToBreakdown(liquidityBreakdownMap, loanResource.resourceAddress, liquidityAmount, liquidityUSD)
    })

    return {
      totals,
      supplied: enhanceBreakdown(suppliedBreakdownMap),
      borrowed: enhanceBreakdown(borrowedBreakdownMap),
      liquidity: enhanceBreakdown(liquidityBreakdownMap),
    }
  })

  const lendingTotals = $derived(lendingSummary.totals)
  const suppliedBreakdown = $derived(lendingSummary.supplied)
  const borrowedBreakdown = $derived(lendingSummary.borrowed)
  const liquidityBreakdown = $derived(lendingSummary.liquidity)

  const collateralSummary = $derived.by(() => {
    const totals: CollateralTotals = {
      totalDepositUSD: dec(0),
      totalDepositUnderDUUSD: dec(0),
      total: dec(0),
    }

    const breakdownMap = new Map<string, { amount: Decimal; value: Decimal }>()

    marketInfoStore.collateralResources.forEach((collateralResource) => {
      const { current: priceInXRD } = priceStore.getPrice(collateralResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)

      const depositValue = collateralResource.totalDeposit.mul(priceInUSD)
      const underDuValue = collateralResource.totalDepositUnderDU.mul(priceInUSD)
      const totalAmount = collateralResource.totalDeposit.add(collateralResource.totalDepositUnderDU)
      const totalValue = depositValue.add(underDuValue)

      totals.totalDepositUSD = totals.totalDepositUSD.add(depositValue)
      totals.totalDepositUnderDUUSD = totals.totalDepositUnderDUUSD.add(underDuValue)
      totals.total = totals.total.add(totalValue)

      addToBreakdown(breakdownMap, collateralResource.resourceAddress, totalAmount, totalValue)
    })

    marketInfoStore.lsuAmounts.forEach(lsuData => {
      const nativeDetails = lsuData.resourceDetails?.$details.native_resource_details as any
      const unitRedemptionValueAmount = nativeDetails?.kind === 'ValidatorLiquidStakeUnit'
        ? nativeDetails.unit_redemption_value?.[0]?.amount ?? 0
        : 0
      const unitRedemptionValue = dec(unitRedemptionValueAmount)
      const priceInUSD = unitRedemptionValue.mul(xrdPriceStore.xrdPrice)

      const value = lsuData.amount.mul(priceInUSD)

      totals.total = totals.total.add(value)

      addToBreakdown(breakdownMap, lsuData.resourceAddress, lsuData.amount, value)
    })

    return {
      totals,
      breakdown: enhanceBreakdown(breakdownMap),
    }
  })

  const collateralTotals = $derived(collateralSummary.totals)
  const collateralBreakdown = $derived(collateralSummary.breakdown)

  const totalCollateralValue = $derived(collateralTotals.total)

  function refreshMarkets() {
    marketInfoStore.loadMarketInfo()
    void priceStore.loadPrices(marketInfoStore.allResourceAddresses)
    void xrdPriceStore.updatePrice()
  }

</script>

<svelte:head>
  <title>Markets - Weft</title>
</svelte:head>

<div class='container mx-auto px-4 py-8 space-y-6'>
  <MarketsHeader onRefresh={refreshMarkets} />

  <MarketsStats
    totalSupplied={lendingTotals.totalSupplied}
    totalBorrowed={lendingTotals.totalBorrowed}
    totalLiquidity={lendingTotals.totalLiquidity}
    totalCollateral={totalCollateralValue}
    onShowSuppliedBreakdown={() => showSuppliedBreakdown = true}
    onShowBorrowedBreakdown={() => showBorrowedBreakdown = true}
    onShowLiquidityBreakdown={() => showLiquidityBreakdown = true}
    onShowCollateralBreakdown={() => showCollateralBreakdownModal = true}
  />

  <!-- Tab Navigation -->
  <div class='card bg-base-200/60'>
    <div class='card-body py-4'>
      <Tabs>
        <Tab id='lending' bind:activeId={activeTab} label='Available Lending Pools' />
        <Tab id='collaterals' bind:activeId={activeTab} label='Available Collaterals' />
      </Tabs>
    </div>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'lending'}
    <LendingPoolsSection />
  {:else if activeTab === 'collaterals'}
    <CollateralsSection />
  {/if}
</div>

<BreakdownModal
  title='Total Supplied Breakdown'
  open={showSuppliedBreakdown}
  items={suppliedBreakdown}
  onClose={() => showSuppliedBreakdown = false}
/>
<BreakdownModal
  title='Total Borrowed Breakdown'
  open={showBorrowedBreakdown}
  items={borrowedBreakdown}
  onClose={() => showBorrowedBreakdown = false}
/>
<BreakdownModal
  title='Available Liquidity Breakdown'
  open={showLiquidityBreakdown}
  items={liquidityBreakdown}
  onClose={() => showLiquidityBreakdown = false}
/>
<BreakdownModal
  title='Total Collateral Breakdown'
  open={showCollateralBreakdownModal}
  items={collateralBreakdown}
  onClose={() => showCollateralBreakdownModal = false}
/>
