<script lang="ts">
  let { left, right } = $props();
</script>

<div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-100 transition-colors">
  <div class="flex items-center gap-4">
    {@render left?.()}
  </div>
  <div class="flex items-center gap-6">
    {@render right?.()}
  </div>
</div>
