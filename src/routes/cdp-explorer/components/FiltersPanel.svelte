<script lang="ts">
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

<div class="card bg-base-200/60">
  <div class="card-body py-4">
    <div class="space-y-4">
      <h3 class="font-semibold">Filters &amp; Sort</h3>

      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-sm">Show only risky CDPs</span>
            <input
              type="checkbox"
              class="toggle toggle-warning toggle-sm"
              checked={showOnlyRiskyCdps}
              onchange={(event) => onToggleShowOnlyRisky((event.target as HTMLInputElement).checked)}
            />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-sm">Sort by loan resource</span>
            <input
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
              checked={sortByLoanResource}
              onchange={(event) => onToggleSortByLoanResource((event.target as HTMLInputElement).checked)}
            />
          </label>
        </div>

        {#if sortByLoanResource}
          <div class="relative w-full md:w-64 loan-resource-dropdown">
            <button
              type="button"
              class="btn btn-outline btn-sm w-full justify-between items-center"
              aria-haspopup="listbox"
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
              <div class="flex-1 min-w-0">
                {#if selectedResource}
                  <CollateralPositionDisplay
                    resourceAddress={selectedResource.resourceAddress}
                    amount={selectedResource.amount}
                    usdValue={selectedResource.value}
                  />
                {:else}
                  <span class="text-base-content/60 text-sm">Select loan resource...</span>
                {/if}
              </div>
              <svg class="w-4 h-4 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {#if dropdownOpen}
              <div class="absolute inset-x-0 mt-2 z-[100] md:left-0 md:w-fit w-full min-w-64 max-w-sm rounded-box border border-base-300 bg-base-100 shadow-xl">
                <div class="p-2">
                  {#each dropdownLoanResources as { resourceAddress, amount, value }}
                    <div class="w-full mb-1">
                      <button
                        type="button"
                        class="w-full text-left p-3 hover:bg-base-200 rounded-lg transition-colors"
                        onclick={() => {
                          onSelectResource(resourceAddress)
                          closeDropdown()
                        }}
                      >
                        <div class="w-full">
                          <CollateralPositionDisplay
                            {resourceAddress}
                            {amount}
                            usdValue={value}
                          />
                          <div class="text-xs text-base-content/60 text-right mt-1">
                            {#if dropdownLoanResourcesTotalValue.isZero()}
                              0%
                            {:else}
                              {(value.div(dropdownLoanResourcesTotalValue).mul(100)).toFixed(1)}%
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
