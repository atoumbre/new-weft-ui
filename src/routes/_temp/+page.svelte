<script lang='ts'>
  import type Decimal from 'decimal.js'
  import CollateralsSection from './components/CollateralsSection.svelte'
  import LendingPoolsSection from './components/LendingPoolsSection.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import MarketsHeader from './components/MarketsHeader.svelte'
  import MarketsStats from './components/MarketsStats.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec } from '$lib/utils'

  let activeTab = $state<'lending' | 'collaterals'>('lending')

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

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

  const lendingTotals = $derived.by((): LendingTotals => {
    const totals: LendingTotals = {
      totalSupplied: dec(0),
      totalBorrowed: dec(0),
      totalLiquidity: dec(0),
    }

    marketInfoStore.loanResources.forEach((loanResource) => {
      const { current: priceInXRD } = priceStore.getPrice(loanResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
      const pool = loanResource.lendingPoolState

      if (!pool)
        return

      const suppliedUSD = pool.totalDeposit.mul(priceInUSD)
      const borrowedUSD = pool.totalLoan.mul(priceInUSD)
      const liquidityUSD = pool.totalDeposit.sub(pool.totalLoan).mul(priceInUSD)

      totals.totalSupplied = totals.totalSupplied.add(suppliedUSD)
      totals.totalBorrowed = totals.totalBorrowed.add(borrowedUSD)
      totals.totalLiquidity = totals.totalLiquidity.add(liquidityUSD)
    })

    return totals
  })

  const collateralTotals = $derived.by((): CollateralTotals => {
    const totals = marketInfoStore.collateralResources.reduce((acc, collateralResource) => {
      const { current: priceInXRD } = priceStore.getPrice(collateralResource.resourceAddress)
      const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)

      return {
        totalDepositUSD: acc.totalDepositUSD.add(collateralResource.totalDeposit.mul(priceInUSD)),
        totalDepositUnderDUUSD: acc.totalDepositUnderDUUSD.add(collateralResource.totalDepositUnderDU.mul(priceInUSD)),
      }
    }, {
      totalDepositUSD: dec(0),
      totalDepositUnderDUUSD: dec(0),
    })

    return {
      ...totals,
      total: totals.totalDepositUSD.add(totals.totalDepositUnderDUUSD),
    }
  })

  const totalLsuCollateral = $derived.by((): Decimal => {
    return marketInfoStore.lsuAmounts.reduce((sum, lsuData) => {
      const nativeDetails = lsuData.resourceDetails?.$details.native_resource_details as any
      const unitRedemptionValueAmount = nativeDetails?.kind === 'ValidatorLiquidStakeUnit'
        ? nativeDetails.unit_redemption_value?.[0]?.amount ?? 0
        : 0
      const unitRedemptionValue = dec(unitRedemptionValueAmount)
      const priceInUSD = unitRedemptionValue.mul(xrdPriceStore.xrdPrice)

      return sum.add(lsuData.amount.mul(priceInUSD))
    }, dec(0))
  })

  const totalCollateralValue = $derived(collateralTotals.total.add(totalLsuCollateral))

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
