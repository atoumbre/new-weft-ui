<script lang='ts'>
  type BreakdownItem = {
    id: string
    label: string
    className: string
    count: number
    percentage: number
  }

  const {
    title,
    open = false,
    items = [],
    emptyMessage = 'No data available',
    percentageLabel = 'of CDPs',
    onClose,
  } = $props<{
    title: string
    open?: boolean
    items?: BreakdownItem[]
    emptyMessage?: string
    percentageLabel?: string
    onClose: () => void
  }>()

  const totalCount = $derived(
    items.reduce((sum: number, item: { count: number }) => sum + item.count, 0),
  )
  const hasData = $derived(items.length > 0 && totalCount > 0)
</script>

{#if open}
  <div
    class='modal-open modal'
    role='dialog'
    tabindex='-1'
    onclick={onClose}
    onkeydown={event => event.key === 'Escape' && onClose()}
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class='modal-box max-w-md'
      role='document'
      onclick={event => event.stopPropagation()}
      onkeydown={event => event.stopPropagation()}
    >
      <div class='mb-4 flex items-center justify-between'>
        <h3 class='text-lg font-bold'>{title}</h3>
        <button class='btn btn-circle btn-ghost btn-sm' onclick={onClose}>✕</button>
      </div>

      {#if !hasData}
        <div class='py-6 text-center text-base-content/60'>{emptyMessage}</div>
      {:else}
        <div class='space-y-3'>
          {#each items as item (item.id)}
            <div class='flex items-center justify-between gap-4 rounded-lg bg-base-200/60 p-3'>
              <div>
                <div class={`font-medium ${item.className}`}>{item.label}</div>
                <div class='text-xs text-base-content/60'>
                  {item.percentage.toFixed(1)}% {percentageLabel}
                </div>
              </div>
              <div class='text-lg font-semibold'>{item.count}</div>
            </div>
          {/each}
        </div>
      {/if}

      <div class='modal-action'>
        <button class='btn' onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
