<script lang='ts'>
  import type Decimal from 'decimal.js'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec } from '$lib/utils/common'
  import { onMount } from 'svelte'
  import CollateralsSection from './components/CollateralsSection.svelte'
  import LendingPoolsSection from './components/LendingPoolsSection.svelte'
  import LSUSection from './components/LSUSection.svelte'
  import MarketsHeader from './components/MarketsHeader.svelte'
  import MarketsStats from './components/MarketsStats.svelte'

  type LendingTotals = {
    totalSupplied: Decimal
    totalBorrowed: Decimal
  }

  type CollateralTotals = {
    totalDepositUSD: Decimal
    totalDepositUnderDUUSD: Decimal
    totalDepositUnderLSU: Decimal
  }

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

  onMount(() => {
    if (marketInfoStore.status === 'not loaded') {
      marketInfoStore.loadMarketInfo().then(() => {
        priceStore.loadPrices(marketInfoStore.allResourceAddresses)
      })
    }
  })

  let activeTab = $state<'lending' | 'collaterals' | 'lsu'>('lending')

  const lendingTotals = $derived.by(() => {
    const totals: LendingTotals = {
      totalSupplied: dec(0),
      totalBorrowed: dec(0),
    }

    marketInfoStore.loanResources.forEach((loanResource) => {
      const { current: priceInXRD } = priceStore.getPrice(loanResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
      const pool = loanResource.lendingPoolState

      if (!pool)
        return

      const suppliedUSD = pool.totalDeposit.mul(priceInUSD)
      const borrowedUSD = pool.totalLoan.mul(priceInUSD)

      totals.totalSupplied = totals.totalSupplied.add(suppliedUSD)
      totals.totalBorrowed = totals.totalBorrowed.add(borrowedUSD)
    })

    return totals
  })

  const collateralTotals = $derived.by(() => {
    const totals: CollateralTotals = {
      totalDepositUSD: dec(0),
      totalDepositUnderDUUSD: dec(0),
      totalDepositUnderLSU: dec(0),
    }

    marketInfoStore.collateralResources.forEach((collateralResource) => {
      const { current: priceInXRD } = priceStore.getPrice(collateralResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)

      const depositValue = collateralResource.totalDeposit.mul(priceInUSD)
      const underDuValue = collateralResource.totalDepositUnderDU.mul(priceInUSD)

      totals.totalDepositUSD = totals.totalDepositUSD.add(depositValue)
      totals.totalDepositUnderDUUSD = totals.totalDepositUnderDUUSD.add(underDuValue)
    })

    marketInfoStore.lsuAmounts.forEach((lsuData) => {
      const nativeDetails = lsuData.resourceDetails?.$details.native_resource_details as any
      const unitRedemptionValueAmount
        = nativeDetails?.kind === 'ValidatorLiquidStakeUnit'
          ? (nativeDetails.unit_redemption_value?.[0]?.amount ?? 0)
          : 0
      const unitRedemptionValue = dec(unitRedemptionValueAmount)
      const priceInUSD = unitRedemptionValue.mul(xrdPriceStore.xrdPrice)

      const underLsuValue = lsuData.amount.mul(priceInUSD)

      totals.totalDepositUnderLSU = totals.totalDepositUnderLSU.add(underLsuValue)
    })

    return totals
  })

  function refreshMarkets() {
    xrdPriceStore.updatePrice()
    marketInfoStore.loadMarketInfo().then(() => {
      priceStore.loadPrices(marketInfoStore.allResourceAddresses)
    })
  }
</script>

<svelte:head>
  <title>Markets - Weft</title>
</svelte:head>

<div class='container mx-auto space-y-6 px-4 py-8'>
  <MarketsHeader onRefresh={refreshMarkets} />

  <MarketsStats
    totalSupplied={lendingTotals.totalSupplied}
    totalBorrowed={lendingTotals.totalBorrowed}
    totalLiquidity={lendingTotals.totalSupplied.sub(lendingTotals.totalBorrowed)}
    totalCollateral={collateralTotals.totalDepositUSD.add(collateralTotals.totalDepositUnderLSU)}
    totalLentCollateral={collateralTotals.totalDepositUnderDUUSD}
  />

  <!-- Tab Navigation -->
  <div class='card bg-base-200/60'>
    <div class='card-body py-4'>
      <Tabs>
        <Tab id='lending' bind:activeId={activeTab} label='Lending Pools' />
        <Tab id='collaterals' bind:activeId={activeTab} label='Collaterals' />
        <Tab id='lsu' bind:activeId={activeTab} label='LSU Collaterals' />
      </Tabs>
    </div>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'lending'}
    <LendingPoolsSection />
  {:else if activeTab === 'collaterals'}
    <CollateralsSection />
  {:else if activeTab === 'lsu'}
    <LSUSection />
  {/if}
</div>
