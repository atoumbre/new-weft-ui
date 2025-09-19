<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { dec, fAmount, fValue } from '$lib/utils'

  type BreakdownItem = {
    resourceAddress: string
    amount: Decimal
    value: Decimal
  }

  const {
    title,
    open = false,
    items = [],
    onClose,
  } = $props<{
    title: string
    open?: boolean
    items?: BreakdownItem[]
    onClose: () => void
  }>()

  const marketInfoStore = getMarketInfoStore()

  const totalValue = $derived(
    items.reduce(
      (sum: { add: (arg0: any) => any }, item: { value: any }) => sum.add(item.value),
      dec(0),
    ),
  )

  function findResource(resourceAddress: string) {
    const collateral = marketInfoStore.collateralResources.find(
      res => res.resourceAddress === resourceAddress,
    )
    if (collateral)
      return collateral

    const loan = marketInfoStore.loanResources.find(
      res => res.resourceAddress === resourceAddress,
    )
    if (loan)
      return loan

    const depositUnit = marketInfoStore.loanResources.find(
      res => res.lendingPoolState?.depositUnitAddress === resourceAddress,
    )
    if (depositUnit)
      return depositUnit

    const lsu = marketInfoStore.lsuAmounts.find(res => res.resourceAddress === resourceAddress)
    if (lsu)
      return lsu

    return null
  }

  function getIcon(resourceAddress: string) {
    const resource: any = findResource(resourceAddress)
    return resource?.resourceDetails?.$metadata?.iconUrl ?? null
  }

  function getLabel(resourceAddress: string) {
    const resource: any = findResource(resourceAddress)
    const metadata = resource?.resourceDetails?.$metadata
    return metadata?.symbol || metadata?.name || `…${resourceAddress.slice(-10)}`
  }

  function formatAddress(address: string) {
    if (!address)
      return ''
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }
</script>

{#if open}
  <div
    class='modal-open modal'
    role='dialog'
    tabindex='-1'
    onclick={onClose}
    onkeydown={e => e.key === 'Escape' && onClose()}
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class='modal-box max-w-2xl'
      role='document'
      onclick={event => event.stopPropagation()}
      onkeydown={event => event.stopPropagation()}
    >
      <div class='mb-4 flex items-center justify-between'>
        <h3 class='text-lg font-bold'>{title}</h3>
        <button class='btn btn-circle btn-ghost btn-sm' onclick={onClose}>✕</button>
      </div>

      <div class='max-h-96 space-y-3 overflow-y-auto'>
        {#if items.length === 0 || totalValue.isZero()}
          <div class='py-6 text-center text-base-content/60'>No data available</div>
        {:else}
          {#each items as { resourceAddress, amount, value } (resourceAddress)}
            {@const iconUrl = getIcon(resourceAddress)}
            {@const label = getLabel(resourceAddress)}
            {@const percentage = totalValue.isZero() ? dec(0) : value.div(totalValue).mul(100)}
            <div class='flex items-center justify-between gap-4 rounded-lg bg-base-200/60 p-3'>
              <div class='flex items-center gap-3'>
                <div
                  class='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-base-100'
                >
                  {#if iconUrl?.startsWith('http')}
                    <img src={iconUrl} alt={label} class='h-full w-full object-cover' />
                  {:else}
                    <span class='text-sm font-semibold'>{label.slice(0, 2).toUpperCase()}</span>
                  {/if}
                </div>
                <div>
                  <div class='font-medium'>{label}</div>
                  <div class='text-xs text-base-content/60'>{formatAddress(resourceAddress)}</div>
                </div>
              </div>
              <div class='text-right'>
                <div class='font-semibold'>{fValue(value)}</div>
                <div class='text-xs text-base-content/60'>
                  {fAmount(amount)} · {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class='modal-action'>
        <button class='btn' onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
