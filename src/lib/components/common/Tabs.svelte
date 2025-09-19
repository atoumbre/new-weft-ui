<script lang='ts'>
  const { children } = $props()
</script>

<div role='tablist' class='tabs w-full tabs-box rounded-xl'>
  {@render children?.()}
</div>
