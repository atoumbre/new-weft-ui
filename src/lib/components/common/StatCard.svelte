<script lang="ts">
  type Props = {
    label?: string;
    value?: string;
    delta?: string;
    deltaTone?: 'success' | 'warning' | 'error' | 'muted';
    helper?: string;
  };
  let { label = '', value = '', delta, deltaTone = 'muted', helper }: Props = $props();

  const toneClass = $derived(
    deltaTone === 'success'
      ? 'text-success'
      : deltaTone === 'warning'
      ? 'text-warning'
      : deltaTone === 'error'
      ? 'text-error'
      : 'opacity-70'
  );
</script>

<div class="card bg-base-200 shadow-sm">
  <div class="card-body p-4">
    <div class="text-sm opacity-70">{label}</div>
    <div class="text-2xl font-semibold">{value}</div>
    {#if delta}
      <div class={`flex items-center text-sm mt-1 ${toneClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
        {delta}
      </div>
    {/if}
    {#if helper}
      <div class="text-sm opacity-70 mt-1">{helper}</div>
    {/if}
  </div>
  </div>
