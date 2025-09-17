import type { StoreError } from './base-store.svelte'
import type { MarketInfoStore } from './market-info.svelte'
import type { PriceStore } from './price-store.svelte'
import type { PythPriceStore } from './pyth-price.svelte'
import { getContext, setContext } from 'svelte'

export interface AppStatus {
  loading: boolean
  error: StoreError | null
  lastUpdate: Date | null
  storeStatuses: Record<string, string>
}

export class AppStateStore {
  private resourceStore!: PriceStore
  private marketInfoStore!: MarketInfoStore
  private pythPriceStore!: PythPriceStore

  // Global loading state - true if any store is loading
  globalLoading = $derived(() => {
    if (!this.allStoresInitialized())
return false

    return this.resourceStore.loading
      || this.marketInfoStore.loading
      || this.pythPriceStore.loading
  })

  // Global error - returns the first error found
  globalError = $derived(() => {
    if (!this.allStoresInitialized())
return null

    return this.resourceStore.error
      || this.marketInfoStore.error
      || this.pythPriceStore.error
  })

  // Overall app status
  appStatus = $derived((): AppStatus => {
    const lastUpdates = this.allStoresInitialized()
      ? [
        this.resourceStore.lastFetch,
        this.marketInfoStore.lastFetch,
        this.pythPriceStore.lastFetch,
      ].filter(Boolean) as Date[]
      : []

    const lastUpdate = lastUpdates.length > 0
      ? new Date(Math.max(...lastUpdates.map(d => d.getTime())))
      : null

    return {
      loading: this.globalLoading(),
      error: this.globalError(),
      lastUpdate,
      storeStatuses: this.getStoreStatuses(),
    }
  })

  // Data freshness indicator
  isDataFresh = $derived(() => {
    if (!this.allStoresInitialized())
return false

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    const stores = [this.resourceStore, this.marketInfoStore]

    return stores.every(store =>
      store.lastFetch && store.lastFetch.getTime() > fiveMinutesAgo,
    )
  })

  constructor() {
    // Initialize after stores are available
    setTimeout(() => {
      this.initializeStoreReferences()
    }, 0)
  }

  private initializeStoreReferences() {
    try {
      this.resourceStore = getContext('ResourceInfoStore') as PriceStore
      this.marketInfoStore = getContext('MarketInfoStore') as MarketInfoStore
      this.pythPriceStore = getContext('PythPriceStoreKey') as PythPriceStore
    }
 catch (error) {
      console.warn('Some stores not yet available:', error)
    }
  }

  private allStoresInitialized(): boolean {
    return !!(
      this.resourceStore
      && this.marketInfoStore
      && this.pythPriceStore
    )
  }

  private getStoreStatuses(): Record<string, string> {
    if (!this.allStoresInitialized()) {
      return { app: 'initializing' }
    }

    return {
      resource: this.resourceStore.status,
      marketInfo: this.marketInfoStore.status,
      pythPrice: this.pythPriceStore.status,
    }
  }

  /**
   * Refresh all store data
   */
  async refreshAll(): Promise<void> {
    if (!this.allStoresInitialized()) {
      console.warn('Cannot refresh: stores not initialized')
      return
    }

    const refreshPromises = [
      this.marketInfoStore.loadMarketInfo(),
      this.pythPriceStore.updatePrice(),
    ]

    // Resource store refresh with current addresses
    const currentAddresses = Object.keys(this.resourceStore.resourceData)
    if (currentAddresses.length > 0) {
      refreshPromises.push(this.resourceStore.loadResourceState(currentAddresses))
    }

    try {
      await Promise.allSettled(refreshPromises)
    }
 catch (error) {
      console.error('Some stores failed to refresh:', error)
    }
  }

  /**
   * Clear all errors across stores
   */
  clearAllErrors(): void {
    if (!this.allStoresInitialized())
return;

    [this.resourceStore, this.marketInfoStore, this.pythPriceStore]
      .forEach((store) => {
        if ('clearError' in store && typeof store.clearError === 'function') {
          store.clearError()
        }
      })
  }

  /**
   * Retry all failed operations
   */
  async retryAll(): Promise<void> {
    if (!this.allStoresInitialized())
return

    const retryPromises = [
      this.resourceStore,
      this.marketInfoStore,
      this.pythPriceStore,
    ]
      .filter(store => store.error && 'retry' in store)
      .map(store => (store as any).retry())

    if (retryPromises.length > 0) {
      try {
        await Promise.allSettled(retryPromises)
      }
 catch (error) {
        console.error('Some retries failed:', error)
      }
    }
  }

  /**
   * Get detailed status for debugging
   */
  getDetailedStatus() {
    return {
      globalLoading: this.globalLoading,
      globalError: this.globalError,
      isDataFresh: this.isDataFresh,
      appStatus: this.appStatus,
      storeDetails: this.allStoresInitialized()
? {

        resource: {
          loading: this.resourceStore.loading,
          error: this.resourceStore.error,
          lastFetch: this.resourceStore.lastFetch,
          resourceCount: Object.keys(this.resourceStore.resourceData).length,
        },
        marketInfo: {
          loading: this.marketInfoStore.loading,
          error: this.marketInfoStore.error,
          lastFetch: this.marketInfoStore.lastFetch,
          hasData: !!this.marketInfoStore.marketConfig,
        },
        pythPrice: {
          loading: this.pythPriceStore.loading,
          error: this.pythPriceStore.error,
          lastFetch: this.pythPriceStore.lastFetch,
          xrdPrice: this.pythPriceStore.xrdPrice.toString(),
        },
      }
: null,
    }
  }
}

const AppStateStoreKey = Symbol('AppStateStore')

export function setAppStateStore() {
  return setContext(AppStateStoreKey, new AppStateStore())
}

export function getAppStateStore() {
  return getContext<ReturnType<typeof setAppStateStore>>(AppStateStoreKey)
}
