<script lang='ts'>
  const { children } = $props()
</script>

<div role='tablist' class='tabs tabs-boxed w-full rounded-xl'>
  {@render children?.()}
</div>
