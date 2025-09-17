<script lang='ts'>
  const { left, right } = $props()
</script>

<div class='group flex items-center justify-between p-4 sm:p-5 border border-base-300/60 rounded-xl bg-base-100/5 hover:bg-base-100/10 hover:border-base-300 transition-colors'>
  <div class='flex items-center gap-4'>
    {@render left?.()}
  </div>
  <div class='flex items-center gap-6'>
    {@render right?.()}
  </div>
</div>
