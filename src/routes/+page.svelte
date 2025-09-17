<script lang='ts'>
  import type Decimal from 'decimal.js'
  import CollateralsSection from '$lib/components/CollateralsSection.svelte'
  import StatCard from '$lib/components/common/StatCard.svelte'
  import LendingPoolsSection from '$lib/components/LendingPoolsSection.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getResourceInfoStore } from '$lib/stores/price-store.svelte'
  import { getPythPriceStore } from '$lib/stores/pyth-price.svelte'
  import { dec, fValue } from '$lib/utils'

  let activeTab = $state<'lending' | 'collaterals'>('lending')

  const marketInfoStore = getMarketInfoStore()
  const resourceStore = getResourceInfoStore()
  const pythPriceStore = getPythPriceStore()

  // Calculate real totals from lending pools
  const totalLending: { totalSuppliedUSD: Decimal, totalBorrowedUSD: Decimal, totalLiquidityUSD: Decimal } = $derived.by(() => {
    return marketInfoStore.loanResources.reduce(
      (sum, loanResource) => {
        const priceInXRD = resourceStore.getFungibleResourceState(loanResource.resourceAddress)
        const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice)

        sum.totalSuppliedUSD = sum.totalSuppliedUSD.add(loanResource.lendingPoolState.totalDeposit.mul(priceInUSD))
        sum.totalBorrowedUSD = sum.totalBorrowedUSD.add(loanResource.lendingPoolState.totalLoan.mul(priceInUSD))
        sum.totalLiquidityUSD = sum.totalSuppliedUSD.sub(sum.totalBorrowedUSD)
        return sum
      },
      { totalSuppliedUSD: dec(0), totalBorrowedUSD: dec(0), totalLiquidityUSD: dec(0) },
    )
  })

  const totalCollateral = $derived.by(() => marketInfoStore.collateralResources.reduce(
    (sum, collateralResource) => {
      const priceInXRD = resourceStore.getFungibleResourceState(collateralResource.resourceAddress)
      const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice)

      sum.totalDepositUSD = sum.totalDepositUSD.add(collateralResource.totalDeposit.mul(priceInUSD))
      sum.totalDepositUnderDUUSD = sum.totalDepositUnderDUUSD.add(collateralResource.totalDepositUnderDU.mul(priceInUSD))

      return sum
    },
    { totalDepositUSD: dec(0), totalDepositUnderDUUSD: dec(0), get total(): Decimal {
      return this.totalDepositUSD.add(this.totalDepositUnderDUUSD)
    } },
  ))

  const totalLSUCollateral = $derived.by(() => {
    if (resourceStore.status === 'not loaded')
      return dec(0)

    return marketInfoStore.lsuAmounts.reduce(
      (sum, lsuData) => {
        const priceInXRD = (lsuData.resourceDetails.$nativeResourceDetails.kind === 'ValidatorLiquidStakeUnit')
          ? dec(lsuData.resourceDetails.$nativeResourceDetails.unit_redemption_value[0].amount)
          : dec(0)
        const priceInUSD = priceInXRD.mul(pythPriceStore.xrdPrice)

        sum = sum.add(lsuData.amount.mul(priceInUSD))

        return sum
      },
      dec(0),
    )
  })

</script>

<!-- Market Stats -->
<div class='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
  <StatCard label='Total Supplied' value={fValue(totalLending.totalSuppliedUSD)} delta='+12.5%' deltaTone='success' />
  <StatCard label='Total Borrowed' value={fValue(totalLending.totalBorrowedUSD)} delta='+3.2%' deltaTone='muted' />
  <StatCard label='Liquidity' value={fValue(totalLending.totalLiquidityUSD)} delta='+8.7%' deltaTone='success' />
  <StatCard label='Total Collateral' value={fValue(totalCollateral.total.add(totalLSUCollateral))} delta='+5.2%' deltaTone='success' />
</div>

<!-- Tabs -->
<div class='space-y-6'>
  <!-- Tab Navigation -->
  <div class='tabs tabs-bordered'>
    <button
      class="tab {activeTab === 'lending' ? 'tab-active' : ''}"
      onclick={() => activeTab = 'lending'}
    >
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4 mr-2'>
        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
      </svg>
      Available Lending Pools
    </button>
    <button
      class="tab {activeTab === 'collaterals' ? 'tab-active' : ''}"
      onclick={() => activeTab = 'collaterals'}
    >
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4 mr-2'>
        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
      </svg>
      Available Collaterals
    </button>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'lending'}
    <LendingPoolsSection />
  {:else if activeTab === 'collaterals'}
    <CollateralsSection />
  {/if}
</div>
