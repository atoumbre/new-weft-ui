<script lang='ts'>
  type Props = {
    label?: string
    value?: string
    delta?: string
    deltaTone?: 'success' | 'warning' | 'error' | 'muted'
    helper?: string
  }
  const { label = '', value = '', delta, deltaTone = 'muted', helper }: Props = $props()

</script>

<div class='card-compact card bg-base-200/60 shadow-sm transition-colors hover:bg-base-200/80'>
  <div class='card-body p-3 sm:p-4'>
    <div class='flex items-start justify-between'>
      <div class='text-xs tracking-wide uppercase opacity-70'>{label}</div>
      {#if delta}
        <div
          class={`badge gap-1 badge-ghost ${deltaTone === 'muted' ? 'opacity-70' : ''} ${deltaTone === 'success' ? 'text-success' : deltaTone === 'warning' ? 'text-warning' : deltaTone === 'error' ? 'text-error' : ''}`}
        >
          {#if deltaTone === 'error'}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              class='h-3 w-3'
            ><path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M19 12l-5 5-5-5M5 5h14'
            /></svg
            >
          {:else}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              class='h-3 w-3'
            ><path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M5 12l5-5 5 5M5 19h14'
            /></svg
            >
          {/if}
          <span class='text-[10px]'>{delta}</span>
        </div>
      {/if}
    </div>
    <div class='text-2xl font-semibold tabular-nums'>{value}</div>
    {#if helper}
      <div class='text-xs opacity-70'>{helper}</div>
    {/if}
  </div>
</div>
