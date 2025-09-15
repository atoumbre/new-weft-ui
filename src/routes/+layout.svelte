<script lang="ts">
  import RadixConnectButton from '$lib/components/common/RadixConnectButton.svelte';
  import { setRadixToolkitStore } from '$lib/stores/rdt.svelte';
  import { setPythPriceStore } from '$lib/stores/pyth-price.svelte';
  import { setMarketInfoStore } from '$lib/stores/market-info.svelte';
  import { setAppStateStore } from '$lib/stores/app-state.svelte';
  import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
  import '../app.css';
  import { onMount } from 'svelte';
  import { setResourceInfoStore } from '$lib/stores/resource-data-store.svelte';
  import { WeftLedgerSateFetcher, defaultLendingPools } from '$lib/internal_modules/dist';
  let address = $state('0x1234...5678');
  let { children } = $props();

  // Initialize stores immediately
  const gatewayApiClient = GatewayApiClient.initialize({
    basePath: 'https://mainnet.radixdlt.com',
    applicationName: 'Weft API',
    headers: {
      'User-Agent': 'WeftFinance'
    }
  });

  WeftLedgerSateFetcher.setInstance(gatewayApiClient);

  // Set up stores synchronously
  setRadixToolkitStore();
  const resourceStore = setResourceInfoStore();
  const pythStore = setPythPriceStore();
  const marketInfoStore = setMarketInfoStore();
  setAppStateStore();

  // Theme state and persistence
  const themes = [ 'light', 'dark'] as const;
  type Theme = (typeof themes)[number];
  let theme: Theme = $state('light');

  onMount(async () => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved && (themes as readonly string[]).includes(saved)) theme = saved as Theme;

    // Load data after mount
    pythStore.updatePrice();
    marketInfoStore.loadMarketInfo().then(()=>{
      resourceStore.loadResourceState(marketInfoStore.allResourceAddresses);
    });

  });

  $effect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme);
  });

  function cycleTheme() {
    const i = themes.indexOf(theme);
    theme = themes[(i + 1) % themes.length];
  }

  // UI polish helpers
  const shorten = (a: string) => (a?.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
  let copied = $state(false);
  let copyTimer: number | undefined;
  async function copyAddress() {
    try {
      await navigator.clipboard?.writeText(address);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => (copied = false), 1200);
    } catch {}
  }


</script>

<div data-theme={theme} class="min-h-screen bg-base-100 text-base-content transition-colors">
  <header class="sticky top-0 z-50 border-b border-base-200 bg-base-200/60 supports-[backdrop-filter]:bg-base-200/40 backdrop-blur shadow-sm">
    <div class="container mx-auto max-w-6xl px-6 py-3">
      <div class="navbar p-0 min-h-0">
        <div class="navbar-start">
          <a href="/" class="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 text-primary"><path d="M12 2l7 4v6c0 5-3.5 9.74-7 10-3.5-.26-7-5-7-10V6l7-4z"/></svg>
            <h1 class="text-xl sm:text-2xl font-semibold tracking-tight">CryptoLend</h1>
            <div class="badge badge-primary badge-outline badge-sm ml-2">Beta</div>
          </a>
        </div>
        <div class="navbar-end gap-3">
          <!-- Theme switcher -->
          <button
            class={"btn btn-ghost btn-sm swap swap-rotate " + (theme === 'dark' ? 'swap-active' : '')}
            onclick={cycleTheme}
            aria-label="Switch theme"
            data-tip="Switch theme"
          >
            <!-- Sun icon (on light) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="swap-on w-5 h-5">
              <path d="M12 18a6 6 0 100-12 6 6 0 000 12z"/>
              <path fill-rule="evenodd" d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm10-9a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 12a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm13.657-6.657a1 1 0 010 1.414L16.95 7.464a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM8.464 16.95a1 1 0 010 1.414l-.707.707A1 1 0 016.343 17.657l.707-.707a1 1 0 011.414 0zm9.193 1.414a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.343 6.343a1 1 0 010-1.414l.707-.707A1 1 0 118.464 5.636l-.707.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            <!-- Moon icon (on dark) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="swap-off w-5 h-5">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
            </svg>
          </button>



          <RadixConnectButton/>
        </div>
      </div>
    </div>
  </header>

  <main class="container mx-auto max-w-6xl px-6 py-6">
    {@render children?.()}
  </main>
</div>
