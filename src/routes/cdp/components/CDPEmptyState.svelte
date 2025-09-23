<script lang='ts'>
  const { title, subtitle, isLoading = false } = $props<{
    title: string
    subtitle: string
    isLoading?: boolean
  }>()
</script>

<div class='card bg-base-200/60'>
  <div class='card-body'>
    <div class='rounded-lg bg-base-100 p-12 text-center'>
      {#if isLoading}
        <div class='loading loading-spinner loading-lg mb-4'></div>
      {/if}
      <div class='text-base-content/60'>{title}</div>
      <div class='mt-2 text-sm text-base-content/40'>{subtitle}</div>
    </div>
  </div>
</div>
