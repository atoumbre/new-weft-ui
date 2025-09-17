<script lang='ts'>
  import type Decimal from 'decimal.js'
  import CollateralsSection from '$lib/components/CollateralsSection.svelte'
  import LendingPoolsSection from '$lib/components/LendingPoolsSection.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import {getXRDPriceStore} from '$lib/stores/xrd-price-store.svelte'
  import { dec, fValue } from '$lib/utils'

  let activeTab = $state<'lending' | 'collaterals'>('lending')

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()

  // Calculate real totals from lending pools
  const totalLending: { totalSuppliedUSD: Decimal, totalBorrowedUSD: Decimal, totalLiquidityUSD: Decimal } = $derived.by(() => {
    return marketInfoStore.loanResources.reduce(
      (sum, loanResource) => {
    const {current:priceInXRD,previous:previousPriceInXRD } = priceStore.getPrice(loanResource.resourceAddress)
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)


        sum.totalSuppliedUSD = sum.totalSuppliedUSD.add(loanResource.lendingPoolState?.totalDeposit.mul(priceInUSD)??dec(0))
        sum.totalBorrowedUSD = sum.totalBorrowedUSD.add(loanResource.lendingPoolState?.totalLoan.mul(priceInUSD)?? dec(0))
        sum.totalLiquidityUSD = sum.totalSuppliedUSD.sub(sum.totalBorrowedUSD)
        return sum
      },
      { totalSuppliedUSD: dec(0), totalBorrowedUSD: dec(0), totalLiquidityUSD: dec(0) },
    )
  })

  const totalCollateral = $derived.by(() => marketInfoStore.collateralResources.reduce(
    (sum, collateralResource) => {
    const {current:priceInXRD,previous:previousPriceInXRD } = priceStore.getPrice(collateralResource.resourceAddress)
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)


      sum.totalDepositUSD = sum.totalDepositUSD.add(collateralResource.totalDeposit.mul(priceInUSD))
      sum.totalDepositUnderDUUSD = sum.totalDepositUnderDUUSD.add(collateralResource.totalDepositUnderDU.mul(priceInUSD))

      return sum
    },
    { totalDepositUSD: dec(0), totalDepositUnderDUUSD: dec(0), get total(): Decimal {
      return this.totalDepositUSD.add(this.totalDepositUnderDUUSD)
    } },
  ))

  const totalLSUCollateral = $derived.by(() => {
    if (priceStore.status === 'not loaded')
      return dec(0)

    return marketInfoStore.lsuAmounts.reduce(
      (sum, lsuData) => {
        const priceInXRD = (lsuData.resourceDetails?.$details.native_resource_details?.kind === 'ValidatorLiquidStakeUnit')
          ? dec(lsuData.resourceDetails.$details.native_resource_details?.unit_redemption_value[0].amount??dec(0))
          : dec(0)
        const priceInUSD = priceInXRD.mul(xrdPriceStore.xrdPrice)

        sum = sum.add(lsuData.amount.mul(priceInUSD))

        return sum
      },
      dec(0),
    )
  })

</script>

<svelte:head>
  <title>Markets - Weft</title>
</svelte:head>

<div class='container mx-auto px-4 py-8 space-y-6'>
  <div class='flex items-center justify-between'>
    <div>
      <h1 class='text-3xl font-bold mb-2'>Markets</h1>
      <p class='text-base-content/70'>Explore lending pools and collateral markets</p>
    </div>
    <div class='flex gap-2'>
      <button class='btn btn-outline btn-sm' onclick={() => {marketInfoStore.loadMarketInfo(); priceStore.loadPrices(); xrdPriceStore.updatePrice()}}>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Market Stats -->
  <div class='grid grid-cols-1 md:grid-cols-4 gap-4'>
    <div class='stat bg-base-200/60 rounded-lg'>
      <div class='stat-title'>Total Supplied</div>
      <div class='stat-value text-xl'>{fValue(totalLending.totalSuppliedUSD)}</div>
      <div class='stat-desc text-success'>+12.5%</div>
    </div>
    <div class='stat bg-base-200/60 rounded-lg'>
      <div class='stat-title'>Total Borrowed</div>
      <div class='stat-value text-xl'>{fValue(totalLending.totalBorrowedUSD)}</div>
      <div class='stat-desc'>+3.2%</div>
    </div>
    <div class='stat bg-base-200/60 rounded-lg'>
      <div class='stat-title'>Available Liquidity</div>
      <div class='stat-value text-xl'>{fValue(totalLending.totalLiquidityUSD)}</div>
      <div class='stat-desc text-success'>+8.7%</div>
    </div>
    <div class='stat bg-base-200/60 rounded-lg'>
      <div class='stat-title'>Total Collateral</div>
      <div class='stat-value text-xl'>{fValue(totalCollateral.total.add(totalLSUCollateral))}</div>
      <div class='stat-desc text-success'>+5.2%</div>
    </div>
  </div>

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
