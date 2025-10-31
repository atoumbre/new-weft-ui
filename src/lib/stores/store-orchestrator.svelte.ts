import type { CdpStore } from './cdp-store.svelte'
import type { MarketInfoStore } from './market-info.svelte'
import type { MarketResourceStore } from './market-resource.svelte'
import type { PriceStore } from './price-store.svelte'
import type { RadixToolkitStore } from './rdt.svelte'
import type { UserAccountsStore } from './user-accounts.svelte'
import type { XRDPriceStore } from './xrd-price-store.svelte'

export interface StoreInitializationOptions {
  parallel?: boolean
  timeout?: number
}

export class StoreOrchestrator {
  private rdtStore: RadixToolkitStore
  private xrdPriceStore: XRDPriceStore
  private marketInfoStore: MarketInfoStore
  private marketResourceStore: MarketResourceStore
  private priceStore: PriceStore
  private cdpStore: CdpStore
  private userAccountsStore: UserAccountsStore

  initialized = $state(false)
  initializationError: Error | null = $state(null)
  initializationProgress = $state({
    total: 0,
    completed: 0,
    currentStage: '',
  })

  constructor(
    rdtStore: RadixToolkitStore,
    xrdPriceStore: XRDPriceStore,
    marketInfoStore: MarketInfoStore,
    marketResourceStore: MarketResourceStore,
    priceStore: PriceStore,
    cdpStore: CdpStore,
    userAccountsStore: UserAccountsStore,
  ) {
    this.rdtStore = rdtStore
    this.xrdPriceStore = xrdPriceStore
    this.marketInfoStore = marketInfoStore
    this.marketResourceStore = marketResourceStore
    this.priceStore = priceStore
    this.cdpStore = cdpStore
    this.userAccountsStore = userAccountsStore
  }

  /**
   * Initialize all stores in the correct order with dependency management
   */
  async initializeStores(options: StoreInitializationOptions = {}) {
    const { parallel = false, timeout = 30000 } = options

    if (this.initialized) {
      console.warn('Stores already initialized')
      return
    }

    this.initializationProgress = {
      total: 5,
      completed: 0,
      currentStage: 'Starting initialization...',
    }

    try {
      const initPromise = parallel
        ? this.initializeParallel()
        : this.initializeSequential()

      // Add timeout protection
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Store initialization timeout')), timeout),
      )

      await Promise.race([initPromise, timeoutPromise])

      this.initialized = true
      this.initializationProgress.currentStage = 'Initialization complete'
    }
    catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error')
      console.error('Store initialization failed:', error)
      throw error
    }
  }

  /**
   * Initialize stores in parallel where possible, respecting dependencies
   */
  private async initializeParallel() {
    // Stage 1: Independent stores (can run in parallel)
    this.initializationProgress.currentStage = 'Initializing core stores...'
    await Promise.all([
      this.xrdPriceStore.updatePrice(),
      this.marketInfoStore.loadMarketInfo(),
    ])
    this.initializationProgress.completed = 2

    // Stage 2: Stores that depend on MarketInfo
    this.initializationProgress.currentStage = 'Loading market resources...'
    await Promise.all([
      this.marketResourceStore.loadResourceInfo(),
      this.priceStore.loadPrices(this.marketInfoStore.allResourceAddressesWithPrice),
    ])
    this.initializationProgress.completed = 4

    // Stage 3: CDP store (depends on market info)
    this.initializationProgress.currentStage = 'Loading CDP data...'
    await this.cdpStore.loadCdpData()
    this.initializationProgress.completed = 5

    // Note: UserAccountsStore is reactive and loads when wallet connects
    // so we don't initialize it here
  }

  /**
   * Initialize stores sequentially for debugging or slower connections
   */
  private async initializeSequential() {
    // Step 1: XRD Price
    this.initializationProgress.currentStage = 'Fetching XRD price...'
    await this.xrdPriceStore.updatePrice()
    this.initializationProgress.completed = 1

    // Step 2: Market Info
    this.initializationProgress.currentStage = 'Loading market information...'
    await this.marketInfoStore.loadMarketInfo()
    this.initializationProgress.completed = 2

    // Step 3: Market Resources
    this.initializationProgress.currentStage = 'Loading market resources...'
    await this.marketResourceStore.loadResourceInfo()
    this.initializationProgress.completed = 3

    // Step 4: Prices for all resources
    this.initializationProgress.currentStage = 'Fetching resource prices...'
    await this.priceStore.loadPrices(this.marketInfoStore.allResourceAddressesWithPrice)
    this.initializationProgress.completed = 4

    // Step 5: CDP Data
    this.initializationProgress.currentStage = 'Loading CDP data...'
    await this.cdpStore.loadCdpData()
    this.initializationProgress.completed = 5

    // Note: UserAccountsStore is reactive and loads when wallet connects
  }

  /**
   * Refresh all stores
   */
  async refreshAll(force = true) {
    await Promise.allSettled([
      this.xrdPriceStore.updatePrice(force),
      this.marketInfoStore.loadMarketInfo(force),
      this.marketResourceStore.loadResourceInfo(undefined, force),
      this.priceStore.loadPrices([], force),
      this.cdpStore.loadCdpData(),
      this.userAccountsStore.loadAccounts(force),
    ])
  }

  /**
   * Get loading status of all stores
   */
  get loadingStatus() {
    return {
      xrdPrice: this.xrdPriceStore.loading,
      marketInfo: this.marketInfoStore.loading,
      marketResource: this.marketResourceStore.loading,
      price: this.priceStore.loading,
      cdp: this.cdpStore.loading,
      userAccounts: this.userAccountsStore.loading,
      anyLoading:
        this.xrdPriceStore.loading
        || this.marketInfoStore.loading
        || this.marketResourceStore.loading
        || this.priceStore.loading
        || this.cdpStore.loading
        || this.userAccountsStore.loading,
    }
  }

  /**
   * Get error status of all stores
   */
  get errorStatus() {
    return {
      xrdPrice: this.xrdPriceStore.error,
      marketInfo: this.marketInfoStore.error,
      marketResource: this.marketResourceStore.error,
      price: this.priceStore.error,
      cdp: this.cdpStore.error,
      userAccounts: this.userAccountsStore.error,
      hasErrors:
        !!this.xrdPriceStore.error
        || !!this.marketInfoStore.error
        || !!this.marketResourceStore.error
        || !!this.priceStore.error
        || !!this.cdpStore.error
        || !!this.userAccountsStore.error,
    }
  }

  /**
   * Check if all critical stores are ready
   */
  get isReady() {
    return (
      this.initialized
      && this.marketInfoStore.initialized
      && !this.loadingStatus.anyLoading
      && !this.errorStatus.hasErrors
    )
  }
}
