<script lang="ts">
  import LendingSection from '$lib/components/LendingSection.svelte';
  import CDPSection from '$lib/components/CDPSection.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import Tab from '$lib/components/common/Tab.svelte';
  import MarketsSection from '$lib/components/MarketsSection.svelte';

  let activeTab = $state<'lending' | 'markets' | 'cdp'>('lending');
</script>

<!-- Dashboard Stats -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
  <StatCard label="Total Supplied" value="$24,567.89" delta="+12.5%" deltaTone="success" />
  <StatCard label="Total Borrowed" value="$8,234.56" delta="+3.2%" deltaTone="muted" />
  <StatCard label="Net Worth" value="$16,333.33" delta="+8.7%" deltaTone="success" />
  <StatCard label="Total Collateral" value="$50,750.00" delta="+5.2%" deltaTone="success" />
  <StatCard label="Health Factor" value="2.34" helper="Safe" />
</div>

<!-- Tabs -->
<div class="space-y-6">
  <Tabs>
    <Tab id="lending" bind:activeId={activeTab} label="Lending">
      {#snippet icon()}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18"/></svg>
      {/snippet}
    </Tab>

    <Tab id="cdp" bind:activeId={activeTab} label="CDP Management">
      {#snippet icon()}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6l7 4-7 4-7-4 7-4z"/></svg>
      {/snippet}
    </Tab> 
       <Tab id="markets" bind:activeId={activeTab} label="Markets">
      {#snippet icon()}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18M3 12h18M3 21h18"/></svg>
      {/snippet}
    </Tab>
  </Tabs>

  {#if activeTab === 'lending'}
    <LendingSection />
  {:else if activeTab === 'markets'}
    <MarketsSection />
  {:else}
    <CDPSection />
  {/if}
</div>
