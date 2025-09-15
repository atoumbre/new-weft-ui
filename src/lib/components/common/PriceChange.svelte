<script lang="ts">
  export let value: string | number; // value without %
  export let isPositive: boolean = true;
</script>

<div class="flex items-center gap-1 tabular-nums" class:text-success={isPositive} class:text-error={!isPositive}>
  {#if isPositive}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
  {:else}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12l-5 5-5-5M5 5h14"/></svg>
  {/if}
  <span>{value}%</span>
</div>
