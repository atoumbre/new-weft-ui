
import { getContext, setContext } from 'svelte';
import { BaseStore } from './base-store.svelte';
import { type MarketConfig, type MarketProtocolFeeConfig, type LoanResource, type CollateralResource, type MarketService, type OperatingStatusValue, type LoanService, type GlobalCollateralService, WeftLedgerSateFetcher } from '$lib/internal_modules/dist';

export class MarketInfoStore extends BaseStore {
  // Separate $state for each market info member
  marketConfig: MarketConfig | null = $state(null);
  marketFeeConfig: MarketProtocolFeeConfig | null = $state(null);
  loanResources: LoanResource[] = $state([]);
  collateralResources: CollateralResource[] = $state([]);
  globalMarketService: Record<MarketService, OperatingStatusValue> | null = $state(null);
  globalLoanService: Record<LoanService, OperatingStatusValue> | null = $state(null);
  globalCollateralService: GlobalCollateralService | null = $state(null);
  allResourceAddresses: string[]

  weftStateApi: WeftLedgerSateFetcher;
  updaterTimer: number | undefined;

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    });

    this.weftStateApi = WeftLedgerSateFetcher.getInstance();

    // Auto-refresh market info every 5 minutes
    this.updaterTimer = setInterval(
      () => {
        this.loadMarketInfo();
      },
      5 * 60 * 1000
    );
  }

  async loadMarketInfo() {
    const result = await this.executeWithErrorHandling(
      async () => {
        return await this.weftStateApi.getMarketInfos();
      },
      'loadMarketInfo',
      true // retryable
    );

    if (result) {
      // Update individual $state members
      this.marketConfig = result.marketConfig;
      this.marketFeeConfig = result.marketFeeConfig;
      this.loanResources = result.loanResources;
      this.collateralResources = result.collateralResources;
      this.globalMarketService = result.globalMarketService;
      this.globalLoanService = result.globalLoanService;
      this.globalCollateralService = result.globalCollateralService;
      this.allResourceAddresses = result.allResourceAddresses
    }
  }

  async retry() {
    await this.loadMarketInfo();
  }

  // Helper methods to access specific market info
  get loanResourcesByAddress() {
    return this.loanResources.reduce((acc, resource) => {
      acc[resource.resourceAddress] = resource;
      return acc;
    }, {} as Record<string, LoanResource>);
  }

  get collateralResourcesByAddress() {
    return this.collateralResources.reduce((acc, resource) => {
      acc[resource.resourceAddress] = resource;
      return acc;
    }, {} as Record<string, CollateralResource>);
  }

  getLoanResource(resourceAddress: string): LoanResource | undefined {
    return this.loanResourcesByAddress[resourceAddress];
  }

  getCollateralResource(resourceAddress: string): CollateralResource | undefined {
    return this.collateralResourcesByAddress[resourceAddress];
  }

  onDestroy() {
    if (this.updaterTimer) {
      clearInterval(this.updaterTimer);
    }
  }
}

const MarketInfoStoreKey = Symbol('MarketInfoStore');

export function setMarketInfoStore() {
  return setContext(MarketInfoStoreKey, new MarketInfoStore());
}

export function getMarketInfoStore() {
  return getContext<ReturnType<typeof setMarketInfoStore>>(MarketInfoStoreKey);
}