<script lang="ts">
  import LendingSection from '$lib/components/LendingSection.svelte';
  import CDPSection from '$lib/components/CDPSection.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import Tab from '$lib/components/common/Tab.svelte';
  import MarketsSection from '$lib/components/MarketsSection.svelte';
  import { getResourceInfoStore } from '$lib/stores/resource-data-store.svelte';
  import { getPythPriceStore } from '$lib/stores/pyth-price.svelte';
  import { dec, fValue } from '$lib/utils';
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte';

  let activeTab = $state<'lending' | 'markets' | 'cdp'>('markets');

  const marketInfoStore = getMarketInfoStore();
  const resourceStore = getResourceInfoStore();
  const pythPriceStore = getPythPriceStore();

  // Calculate real totals from lending pools
  const total = $derived.by(() => {

    return marketInfoStore.loanResources.reduce((sum, loanResource) => {
      const resourceInfo = resourceStore.getFungibleResourceState(loanResource.resourceAddress);
      const priceInXRD = resourceInfo?.price?.toNumber() || 0;
      const priceInUSD = priceInXRD * pythPriceStore.xrdPrice.toNumber();


       sum.totalSuppliedUSD = sum.totalSuppliedUSD + (loanResource.lendingPoolState.totalDeposit.toNumber() * priceInUSD);
       sum.totalBorrowedUSD = sum.totalBorrowedUSD + (loanResource.lendingPoolState.totalLoan.toNumber() * priceInUSD);
 sum.totalLiquidityUSD  =       sum.totalSuppliedUSD -        sum.totalBorrowedUSD 
       return sum
    }, {totalSuppliedUSD:0,totalBorrowedUSD:0,totalLiquidityUSD:0});
  });


  // TODO: Calculate total collateral from CDP data when available
  let totalCollateralUSD = $derived(0);
</script>

<!-- Dashboard Stats -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <StatCard label="Total Supplied" value={fValue(dec(total.totalSuppliedUSD))} delta="+12.5%" deltaTone="success" />
  <StatCard label="Total Borrowed" value={fValue(dec(total.totalBorrowedUSD))} delta="+3.2%" deltaTone="muted" />
  <StatCard label="Liquidity" value={fValue(dec(total.totalLiquidityUSD))} delta="+8.7%" deltaTone="success" />
  <StatCard label="Total Collateral" value={fValue(dec(totalCollateralUSD))} delta="+5.2%" deltaTone="success" />
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
