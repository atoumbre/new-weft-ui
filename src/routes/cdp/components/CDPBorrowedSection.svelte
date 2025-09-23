<script lang='ts'>
  import type { LoanPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import TokenCell from '$lib/components/common/TokenCell.svelte'
  import { fPercent, fValue } from '$lib/utils/common'

  type ResourceMeta = {
    symbol: string
    name: string
    logo: string
    iconUrl?: string
    priceUsd: Decimal
    previousPriceUsd: Decimal
    changePct: Decimal | null
    collateralLtv?: Decimal
    borrowingApr?: Decimal
  }

  const {
    currentLoanList,
    resourceMeta,
    shortenAddress,
    onBorrow,
    onRepay,
  } = $props<{
    currentLoanList: Array<{ address: string, loan: LoanPositionData }>
    resourceMeta: Map<string, ResourceMeta>
    shortenAddress: (address: string, prefix?: number, suffix?: number) => string
    onBorrow: (symbol?: string) => void
    onRepay: (symbol?: string) => void
  }>()
</script>

<div class='card bg-base-200/60'>
  <div class='card-body'>
    <div class='flex items-center justify-between mb-4'>
      <h3 class='card-title'>Borrowed Assets</h3>
      <button class='btn btn-primary btn-sm' onclick={() => onBorrow()}>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
        </svg>
        Borrow
      </button>
    </div>

    {#if currentLoanList.length}
      <div class='space-y-3'>
        {#each currentLoanList as { address, loan }}
          {@const meta = resourceMeta.get(address)}
          <ListRow>
            {#snippet left()}
              <TokenCell
                logo={meta?.logo}
                iconUrl={meta?.iconUrl}
                symbol={meta?.symbol ?? shortenAddress(address)}
                price={meta ? fValue(meta.priceUsd) : undefined}
                change={meta?.changePct ? meta.changePct.toFixed(2) : undefined}
              />
            {/snippet}
            {#snippet right()}
              <div class='flex flex-wrap items-center gap-4 sm:gap-6'>
                <AmountDisplay amount={loan.amount} priceUSD={meta?.priceUsd} />
                <div class='text-right'>
                  <div class='text-sm opacity-70'>APR</div>
                  <div class='font-medium text-warning'>
                    {meta?.borrowingApr ? fPercent(meta.borrowingApr) : '—'}
                  </div>
                </div>
                <div class='flex gap-2'>
                  <button
                    class='btn btn-outline btn-sm'
                    onclick={() => onRepay(meta?.symbol)}
                  >
                    Repay
                  </button>
                  <button
                    class='btn btn-outline btn-sm'
                    onclick={() => onBorrow(meta?.symbol)}
                  >
                    Borrow
                  </button>
                </div>
              </div>
            {/snippet}
          </ListRow>
        {/each}
      </div>
    {:else}
      <div class='rounded-lg bg-base-100 p-8 text-center'>
        <div class='text-base-content/60'>No outstanding loans for this CDP</div>
        <div class='mt-2 text-sm text-base-content/40'>Borrow assets using your collateral</div>
      </div>
    {/if}
  </div>
</div>
