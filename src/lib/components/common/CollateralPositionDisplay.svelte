<script lang='ts'>
  import type { CollateralResource, LoanResource } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { fAmount, fValue } from '$lib/utils/common'

  interface Props {
    resourceAddress: string
    amount: Decimal
    usdValue: Decimal
    fullPrecision?: boolean
  }

  const { resourceAddress, amount, usdValue, fullPrecision = false }: Props = $props()

  const marketInfoStore = getMarketInfoStore()

  // Get resource info from market store - lookup order: collateral, loan, lsu
  const resourceMetadata = $derived.by(() => {
    // First try collateralResources
    let resource: CollateralResource | LoanResource | undefined = marketInfoStore.collateralResources.find(
      res => res.resourceAddress === resourceAddress,
    )
    if (resource)
      return resource.metadata

    // Then try loanResources
    resource = marketInfoStore.loanResources.find(res => res.resourceAddress === resourceAddress)
    if (resource)
      return resource.metadata

    resource = marketInfoStore.loanResources.find(
      res => res.lendingPoolState?.depositUnitAddress === resourceAddress,
    )
    if (resource)
      return resource.duMetadata

    // Finally try lsuAmounts
    const lsuResource = marketInfoStore.lsuAmounts.find(
      res => res.resourceAddress === resourceAddress,
    )
    if (lsuResource)
      return lsuResource.metadata

    return null
  })

  // Extract symbol, icon, and other metadata
  const symbol = $derived.by(() => {
    return (
      resourceMetadata?.symbol
      || resourceMetadata?.name
      || resourceAddress.slice(-4)
    )
  })

  const iconUrl = $derived.by(() => {
    return resourceMetadata?.iconUrl
  })

  // Determine if this is a loan resource (for icon fallback)
  const isLoanResource = $derived.by(() => {
    return marketInfoStore.loanResources.some(res => res.resourceAddress === resourceAddress)
  })

</script>

<div class='flex items-center gap-2 text-sm'>
  <!-- Icon -->
  <div class='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full'>
    {#if iconUrl?.startsWith('http')}
      <img src={iconUrl} alt={symbol} class='h-6 w-6 rounded-full' />
    {:else if isLoanResource}
      <div class='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px]'>
        💰
      </div>
    {:else}
      <div class='flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[10px]'>
        🔹
      </div>
    {/if}
  </div>

  <!-- Amount, Symbol, and USD Value -->
  <span class='truncate'>
    <span class='font-medium'>{fAmount(amount, { fullPrecision })}</span>
    <span class='ml-1 opacity-70'>{symbol}</span>
    <span class='ml-1 opacity-60'>({fValue(usdValue, { fullPrecision: false })})</span>
  </span>
</div>
