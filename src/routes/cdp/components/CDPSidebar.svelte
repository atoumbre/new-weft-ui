<script lang='ts'>
  import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
  import type { WeftUserAccountData } from '$lib/stores/user-accounts.svelte'
  import type Decimal from 'decimal.js'
  import HealthPill from '$lib/components/common/HealthPill.svelte'
  import { dec, fPercent } from '$lib/utils/common'

  type AccountOption = {
    address: string
    label: string
    data: WeftUserAccountData
  }

  const {
    accountOptions,
    selectedAccountAddress,
    cdpList,
    selectedCdpId,
    userAccountsLoading,
    walletAccountCount,
    formatCdpId,
    fValueCompact,
    convertToUsd,
    onAccountChange,
    onCdpSelect,
  } = $props<{
    accountOptions: AccountOption[]
    selectedAccountAddress: string
    cdpList: CollateralizeDebtPositionData[]
    selectedCdpId: string
    userAccountsLoading: boolean
    walletAccountCount: number
    formatCdpId: (id: string) => string
    fValueCompact: (amount: Decimal) => string
    convertToUsd: (value?: Decimal | null) => Decimal
    onAccountChange: (address: string) => void
    onCdpSelect: (id: string) => void
  }>()
</script>

<aside class='card bg-base-200/60'>
  <div class='card-body space-y-6'>
    <div>
      <h2 class='card-title text-lg mb-2'>Your CDPs</h2>
      <p class='text-sm text-base-content/70'>Select an account and CDP to view details</p>
    </div>

    {#if accountOptions.length}
      <div class='form-control w-full'>
        <label class='label' for='account-select'>
          <span class='label-text text-sm font-medium'>Account</span>
        </label>
        <select
          id='account-select'
          class='select select-bordered w-full'
          value={selectedAccountAddress}
          onchange={e => onAccountChange(e.currentTarget.value)}
        >
          {#each accountOptions as option}
            <option value={option.address}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class='space-y-3'>
        <div class='flex items-center justify-between'>
          <span class='text-sm font-medium'>CDPs ({cdpList.length})</span>
        </div>
        {#if cdpList.length}
          <div class='space-y-2'>
            {#each cdpList as cdp}
              <button
                type='button'
                class={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedCdpId === cdp.id
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 bg-base-100 hover:bg-base-200'
                }`}
                onclick={() => onCdpSelect(cdp.id)}
              >
                <div class='flex items-center justify-between'>
                  <div class='flex-1'>
                    <div class='flex items-center justify-between mb-1'>
                      <div class='font-mono text-sm font-medium'>{formatCdpId(cdp.id)}</div>
                      <HealthPill ltv={cdp.liquidationLtv ?? dec(0)} />
                    </div>
                    <div class='flex items-center justify-between text-xs text-base-content/60'>
                      <span>LTV: {cdp.liquidationLtv ? fPercent(cdp.liquidationLtv) : '—'}</span>
                    </div>
                    <div class='flex items-center justify-between text-xs text-base-content/50 mt-1'>
                      <span>Collateral: {fValueCompact(convertToUsd(cdp.totalCollateralValue))}</span>
                      <span>Debt: {fValueCompact(convertToUsd(cdp.totalLoanValue))}</span>
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else if userAccountsLoading}
          <div class='rounded-lg bg-base-100 p-4 text-center'>
            <div class='loading loading-spinner loading-sm'></div>
            <div class='mt-2 text-sm text-base-content/70'>Loading CDPs...</div>
          </div>
        {:else}
          <div class='rounded-lg bg-base-100 p-4 text-center'>
            <div class='text-sm text-base-content/70'>No CDPs found for this account</div>
          </div>
        {/if}
      </div>
    {:else if userAccountsLoading}
      <div class='rounded-lg bg-base-100 p-4 text-center'>
        <div class='loading loading-spinner loading-sm'></div>
        <div class='mt-2 text-sm text-base-content/70'>Loading accounts...</div>
      </div>
    {:else if walletAccountCount === 0}
      <div class='rounded-lg bg-base-100 p-4 text-center'>
        <div class='text-sm text-base-content/70'>Connect your Radix wallet to view accounts</div>
      </div>
    {:else}
      <div class='rounded-lg bg-base-100 p-4 text-center'>
        <div class='text-sm text-base-content/70'>No Weft-enabled accounts detected</div>
      </div>
    {/if}
  </div>
</aside>
