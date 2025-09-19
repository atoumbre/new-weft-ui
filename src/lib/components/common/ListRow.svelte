<script lang='ts'>
  const { left, right } = $props()
</script>

<div
  class='group flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100/5 p-4 transition-colors hover:border-base-300 hover:bg-base-100/10 sm:p-5'
>
  <div class='flex items-center gap-4'>
    {@render left?.()}
  </div>
  <div class='flex items-center gap-6'>
    {@render right?.()}
  </div>
</div>
