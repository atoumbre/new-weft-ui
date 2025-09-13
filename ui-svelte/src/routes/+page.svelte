<script>
  import LendingSection from '$lib/components/LendingSection.svelte';
  import CDPSection from '$lib/components/CDPSection.svelte';

  let activeTab = 'lending';
</script>

<!-- Dashboard Stats -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="text-sm opacity-70">Total Supplied</div>
      <div class="text-2xl font-semibold">$24,567.89</div>
      <div class="flex items-center text-sm text-success mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
        +12.5%
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="text-sm opacity-70">Total Borrowed</div>
      <div class="text-2xl font-semibold">$8,234.56</div>
      <div class="flex items-center text-sm opacity-70 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
        +3.2%
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="text-sm opacity-70">Net Worth</div>
      <div class="text-2xl font-semibold">$16,333.33</div>
      <div class="flex items-center text-sm text-success mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
        +8.7%
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="text-sm opacity-70">Total Collateral</div>
      <div class="text-2xl font-semibold">$50,750.00</div>
      <div class="flex items-center text-sm text-success mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5 5 5M5 19h14"/></svg>
        +5.2%
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="text-sm opacity-70">Health Factor</div>
      <div class="text-2xl font-semibold text-success">2.34</div>
      <div class="text-sm opacity-70 mt-1">Safe</div>
    </div>
  </div>
  
</div>

<!-- Tabs -->
<div class="space-y-6">
  <div role="tablist" class="tabs tabs-boxed w-full max-w-md">
    <button
      role="tab"
      class="tab flex items-center gap-2"
      class:tab-active={activeTab === 'lending'}
      on:click={() => (activeTab = 'lending')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18"/></svg>
      <span>Lending</span>
    </button>
    <button
      role="tab"
      class="tab flex items-center gap-2"
      class:tab-active={activeTab === 'cdp'}
      on:click={() => (activeTab = 'cdp')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6l7 4-7 4-7-4 7-4z"/></svg>
      <span>CDP Management</span>
    </button>
  </div>

  {#if activeTab === 'lending'}
    <LendingSection />
  {:else}
    <CDPSection />
  {/if}
</div>
