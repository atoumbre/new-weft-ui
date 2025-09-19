<script lang='ts'>
  import type Decimal from 'decimal.js'
  import CollateralPositionDisplay from '$lib/components/common/CollateralPositionDisplay.svelte'

  type LoanResourceEntry = {
    resourceAddress: string
    amount: Decimal
    value: Decimal
  }

  const {
    showOnlyRiskyCdps,
    sortByLoanResource,
    dropdownLoanResources = [],
    dropdownLoanResourcesTotalValue,
    selectedResource,
    onToggleShowOnlyRisky,
    onToggleSortByLoanResource,
    onSelectResource,
  } = $props<{
    showOnlyRiskyCdps: boolean
    sortByLoanResource: boolean
    dropdownLoanResources?: LoanResourceEntry[]
    dropdownLoanResourcesTotalValue: Decimal
    selectedResource: LoanResourceEntry | null
    onToggleShowOnlyRisky: (value: boolean) => void
    onToggleSortByLoanResource: (value: boolean) => void
    onSelectResource: (resourceAddress: string) => void
  }>()

  let dropdownOpen = $state(false)

  const toggleDropdown = () => {
    dropdownOpen = !dropdownOpen
  }

  const closeDropdown = () => {
    dropdownOpen = false
  }

  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement
    if (!target.closest('.loan-resource-dropdown'))
      closeDropdown()
  }

  $effect(() => {
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<div class='card bg-base-200/60'>
  <div class='card-body py-4'>
    <div class='space-y-4'>
      <h3 class='font-semibold'>Filters &amp; Sort</h3>

      <div class='flex flex-col gap-4 md:flex-row md:items-center'>
        <div class='form-control'>
          <label class='label cursor-pointer gap-2'>
            <span class='label-text text-sm'>Show only risky CDPs</span>
            <input
              type='checkbox'
              class='toggle toggle-sm toggle-warning'
              checked={showOnlyRiskyCdps}
              onchange={event =>
                onToggleShowOnlyRisky((event.target as HTMLInputElement).checked)}
            />
          </label>
        </div>

        <div class='form-control'>
          <label class='label cursor-pointer gap-2'>
            <span class='label-text text-sm'>Sort by loan resource</span>
            <input
              type='checkbox'
              class='toggle toggle-primary toggle-sm'
              checked={sortByLoanResource}
              onchange={event =>
                onToggleSortByLoanResource((event.target as HTMLInputElement).checked)}
            />
          </label>
        </div>

        {#if sortByLoanResource}
          <div class='loan-resource-dropdown relative w-full md:w-64'>
            <button
              type='button'
              class='btn w-full items-center justify-between btn-outline btn-sm'
              aria-haspopup='listbox'
              aria-expanded={dropdownOpen}
              onclick={toggleDropdown}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDropdown()
                }
                if (e.key === 'Escape')
                  closeDropdown()
              }}
            >
              <div class='min-w-0 flex-1'>
                {#if selectedResource}
                  <CollateralPositionDisplay
                    resourceAddress={selectedResource.resourceAddress}
                    amount={selectedResource.amount}
                    usdValue={selectedResource.value}
                  />
                {:else}
                  <span class='text-sm text-base-content/60'>Select loan resource...</span>
                {/if}
              </div>
              <svg
                class='ml-2 h-4 w-4 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='M19 9l-7 7-7-7'
                ></path>
              </svg>
            </button>

            {#if dropdownOpen}
              <div
                class='absolute inset-x-0 z-[100] mt-2 w-full max-w-sm min-w-64 rounded-box border border-base-300 bg-base-100 shadow-xl md:left-0 md:w-fit'
              >
                <div class='p-2'>
                  {#each dropdownLoanResources as { resourceAddress, amount, value }}
                    <div class='mb-1 w-full'>
                      <button
                        type='button'
                        class='w-full rounded-lg p-3 text-left transition-colors hover:bg-base-200'
                        onclick={() => {
                          onSelectResource(resourceAddress)
                          closeDropdown()
                        }}
                      >
                        <div class='w-full'>
                          <CollateralPositionDisplay {resourceAddress} {amount} usdValue={value} />
                          <div class='mt-1 text-right text-xs text-base-content/60'>
                            {#if dropdownLoanResourcesTotalValue.isZero()}
                              0%
                            {:else}
                              {value.div(dropdownLoanResourcesTotalValue).mul(100).toFixed(1)}%
                            {/if}
                          </div>
                        </div>
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
