<script lang="ts">
  const { onRefresh } = $props<{ onRefresh: () => void }>()
</script>

<div class="flex items-center justify-between">
  <div>
    <h1 class="text-3xl font-bold mb-2">CDP Explorer</h1>
    <p class="text-base-content/70">Overview of all Collateralized Debt Positions</p>
  </div>
  <div class="flex gap-2">
    <button class="btn btn-outline btn-sm" onclick={onRefresh}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  </div>
</div>
