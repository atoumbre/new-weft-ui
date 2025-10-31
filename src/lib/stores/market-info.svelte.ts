import type {
  CollateralResource,
  GlobalCollateralService,
  LoanResource,
  LoanService,
  MarketConfig,
  MarketProtocolFeeConfig,
  MarketService,
  OperatingStatusValue,
} from '$lib/internal_modules/weft-ledger-state'
import { WeftLedgerSateFetcher } from '$lib/internal_modules/weft-ledger-state'
import { getContext, onDestroy, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

export class MarketInfoStore extends BaseStore {
  // Separate $state for each market info member
  marketConfig: MarketConfig | null = $state(null)
  marketFeeConfig: MarketProtocolFeeConfig | null = $state(null)
  loanResources: LoanResource[] = $state([])
  collateralResources: CollateralResource[] = $state([])
  globalMarketService: Record<MarketService, OperatingStatusValue> | null = $state(null)
  globalLoanService: Record<LoanService, OperatingStatusValue> | null = $state(null)
  globalCollateralService: GlobalCollateralService | null = $state(null)

  allResourceAddressesWithPrice = $derived.by(() => {
    return [
      ...new Set([
        ...this.loanResources.map(res => res.resourceAddress),
        ...this.collateralResources.map(res => res.resourceAddress),
      ]),
    ]
  })

  allResourceAddresses2 = $derived.by(() => {
    return [
      ...new Set([
        ...this.loanResources.map(res => res.resourceAddress),
        ...this.loanResources.map(res => res.lendingPoolState?.depositUnitAddress),
        ...this.collateralResources.map(res => res.resourceAddress),
      ]),
    ].filter(r => r !== undefined)
  })

  weftStateApi: WeftLedgerSateFetcher

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()

    // Auto-refresh market info every 5 minutes
    let updaterTimer: ReturnType<typeof setInterval> | undefined
    if (typeof window !== 'undefined') {
      updaterTimer = setInterval(
        () => {
          this.loadMarketInfo()
        },
        5 * 60 * 1000,
      )
    }

    onDestroy(() => {
      if (updaterTimer) {
        clearInterval(updaterTimer)
      }
    })
  }

  async retry() {
    await this.loadMarketInfo()
  }

  async loadMarketInfo(force = false) {
    if (this.loading)
      return

    if (!force && this.isDataFresh() && this.initialized)
      return

    const result = await this.executeWithErrorHandling(
      async () => {
        return await this.weftStateApi.getMarketInfos()
      },
      'loadMarketInfo',
      true, // retryable
    )

    if (result) {
      // Update individual $state members
      this.marketConfig = result.marketConfig
      this.marketFeeConfig = result.marketFeeConfig
      this.loanResources = result.loanResources
      this.collateralResources = result.collateralResources
      this.globalMarketService = result.globalMarketService
      this.globalLoanService = result.globalLoanService
      this.globalCollateralService = result.globalCollateralService
    }
  }

  // Helper methods to access specific market info
  get loanResourcesByAddress() {
    return this.loanResources.reduce(
      (acc, resource) => {
        acc[resource.resourceAddress] = resource
        return acc
      },
      {} as Record<string, LoanResource>,
    )
  }

  get collateralResourcesByAddress() {
    return this.collateralResources.reduce(
      (acc, resource) => {
        acc[resource.resourceAddress] = resource
        return acc
      },
      {} as Record<string, CollateralResource>,
    )
  }

  getLoanResource(resourceAddress: string): LoanResource | undefined {
    return this.loanResourcesByAddress[resourceAddress]
  }

  getCollateralResource(resourceAddress: string): CollateralResource | undefined {
    return this.collateralResourcesByAddress[resourceAddress]
  }
}

const MarketInfoStoreKey = Symbol('MarketInfoStore')

export function setMarketInfoStore() {
  return setContext(MarketInfoStoreKey, new MarketInfoStore())
}

export function getMarketInfoStore() {
  return getContext<ReturnType<typeof setMarketInfoStore>>(MarketInfoStoreKey)
}
