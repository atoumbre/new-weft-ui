<script lang='ts'>
  import type { CollateralResource, LoanResource } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { fAmount, fValue } from '$lib/utils'

  interface Props {
    resourceAddress: string
    amount: Decimal
    usdValue: Decimal
  }

  const { resourceAddress, amount, usdValue }: Props = $props()

  const marketInfoStore = getMarketInfoStore()

  // Get resource info from market store - lookup order: collateral, loan, lsu
  const resourceInfo = $derived.by(() => {
    // First try collateralResources
    let resource: CollateralResource | LoanResource = marketInfoStore.collateralResources.find(res => res.resourceAddress === resourceAddress)
    if (resource)
      return resource

    // Then try loanResources
    resource = marketInfoStore.loanResources.find(res => res.resourceAddress === resourceAddress)
    if (resource)
      return resource

    resource = marketInfoStore.loanResources.find(res => res.lendingPoolState.depositUnitAddress === resourceAddress)
    if (resource)
      return resource

    // Finally try lsuAmounts
    const lsuResource = marketInfoStore.lsuAmounts.find(res => res.resourceAddress === resourceAddress)
    if (lsuResource)
      return lsuResource

    return null
  })

  // Extract symbol, icon, and other metadata
  const symbol = $derived.by(() => {
    return resourceInfo?.resourceDetails?.$metadata?.symbol
      || resourceInfo?.resourceDetails?.$metadata?.name
      || resourceAddress.slice(-4)
  })

  const iconUrl = $derived.by(() => {
    return resourceInfo?.resourceDetails?.$metadata?.iconUrl
  })

  // Determine if this is a loan resource (for icon fallback)
  const isLoanResource = $derived.by(() => {
    return marketInfoStore.loanResources.some(res => res.resourceAddress === resourceAddress)
  })

  // Format amount for display
  const formattedAmount = $derived.by(() => {
    if (amount.lt(0.01)) {
      return amount.toFixed(6)
    }
    else if (amount.lt(1)) {
      return amount.toFixed(4)
    }
    else if (amount.lt(1000)) {
      return amount.toFixed(2)
    }
    else {
      return amount.toFixed(0)
    }
  })
</script>

<div class='flex items-center gap-2 text-sm'>
  <!-- Icon -->
  <div class='w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0'>
    {#if iconUrl?.startsWith('http')}
      <img src={iconUrl} alt={symbol} class='w-4 h-4 rounded-full' />
    {:else if isLoanResource}
      <div class='w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px]'>
        💰
      </div>
    {:else}
      <div class='w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px]'>
        🔹
      </div>
    {/if}
  </div>

  <!-- Amount, Symbol, and USD Value with full precision -->
  <span class='truncate'>
    <span class='font-medium'>{fAmount(amount)}</span>
    <span class='opacity-70 ml-1'>{symbol}</span>
    <span class='opacity-60 ml-1'>({fValue(usdValue, { fullPrecision: true })})</span>
  </span>
</div>
