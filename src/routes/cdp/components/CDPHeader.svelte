<script lang='ts'>
  const { selectedAccount, onCreateCDP } = $props<{
    selectedAccount: any
    onCreateCDP: () => void
  }>()
</script>

<div class='flex items-center justify-between'>
  <div>
    <h1 class='mb-2 text-3xl font-bold'>CDP Management</h1>
    <p class='text-base-content/70'>Manage your collateralized debt positions</p>
  </div>
  <div class='flex gap-2'>
    <button
      class='btn btn-primary btn-sm'
      onclick={onCreateCDP}
      disabled={!selectedAccount}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        class='h-4 w-4'
      >
        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
      </svg>
      Create New CDP
    </button>
  </div>
</div>
