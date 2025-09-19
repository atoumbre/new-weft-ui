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

  const totalCount = $derived(items.reduce((sum: number, item: { count: number; }) => sum + item.count, 0))
  const hasData = $derived(items.length > 0 && totalCount > 0)
</script>

{#if open}
  <div
    class='modal modal-open'
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
      <div class='flex justify-between items-center mb-4'>
        <h3 class='font-bold text-lg'>{title}</h3>
        <button class='btn btn-sm btn-circle btn-ghost' onclick={onClose}>✕</button>
      </div>

      {#if !hasData}
        <div class='text-center text-base-content/60 py-6'>{emptyMessage}</div>
      {:else}
        <div class='space-y-3'>
          {#each items as item (item.id)}
            <div class='p-3 bg-base-200/60 rounded-lg flex items-center justify-between gap-4'>
              <div>
                <div class={`font-medium ${item.className}`}>{item.label}</div>
                <div class='text-xs text-base-content/60'>{item.percentage.toFixed(1)}% {percentageLabel}</div>
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
