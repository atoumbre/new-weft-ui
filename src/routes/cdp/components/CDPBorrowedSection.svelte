<script lang='ts'>
  import type { LoanPositionData } from '$lib/internal_modules/weft-ledger-state'
  import CDPBorrowCard from './CDPBorrowCard.svelte'

  const {
    currentLoanList,
    onBorrow,
    onRepay,
  }: {
    currentLoanList: Array<{ address: string, loan: LoanPositionData }>
    onBorrow: (symbol?: string) => void
    onRepay: (symbol?: string) => void
  } = $props()
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
      {#each currentLoanList as { address, loan }}
        <CDPBorrowCard resourceAddress={address} loanPosition={loan} {onRepay} {onBorrow}></CDPBorrowCard>
      {/each}
    {:else}
      <div class='rounded-lg bg-base-100 p-8 text-center'>
        <div class='text-base-content/60'>No outstanding loans for this CDP</div>
        <div class='mt-2 text-sm text-base-content/40'>Borrow assets using your collateral</div>
      </div>
    {/if}
  </div>
</div>
