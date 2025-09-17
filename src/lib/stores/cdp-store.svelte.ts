import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
import { WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'
import { getPythPriceStore } from './pyth-price.svelte'

export class CdpStore extends BaseStore {
  cdpList: CollateralizeDebtPositionData[] = $state([])
  cdpIds: any[] = $state([])
  filteredCdpList: CollateralizeDebtPositionData[] = $state([])

  weftStateApi: WeftLedgerSateFetcher
  updaterTimer: number | undefined
  pythPriceStore: ReturnType<typeof getPythPriceStore>

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()
    this.pythPriceStore = getPythPriceStore()

    // Auto-refresh CDP data every 5 minutes
    this.updaterTimer = setInterval(
      () => {
        this.loadCdpData()
      },
      15 * 60 * 1000,
    )
  }

  async loadCdpData() {
    const result = await this.executeWithErrorHandling(
      async () => {
        // Fetch all CDP IDs
        const AllIds = await this.weftStateApi.getCdpIds()

        const ids = AllIds.map(a => a.non_fungible_id)

        // Fetch multiple CDP data
        const list = await WeftLedgerSateFetcher.getInstance().getMultipleCdp(ids)

        return { ids: AllIds, list }
      },
      'loadCdpData',
      true, // retryable
    )

    if (result) {
      this.cdpIds = result.ids
      this.cdpList = result.list.data || []
      this.filterActiveCdps()
    }
  }

  async retry() {
    await this.loadCdpData()
  }

  // Filter out CDPs with no collateral and loan positions
  private filterActiveCdps() {
    this.filteredCdpList = this.cdpList.filter((cdp) => {
      const hasCollateral = Object.keys(cdp.collateralPositions || {}).length > 0
        || Object.keys(cdp.nftCollateralPositions || {}).length > 0
      const hasLoans = Object.keys(cdp.loanPositions || {}).length > 0
      return hasCollateral || hasLoans
    })
  }

  onDestroy() {
    if (this.updaterTimer) {
      clearInterval(this.updaterTimer)
    }
  }
}

const CdpStoreKey = Symbol('CdpStore')

export function setCdpStore() {
  return setContext(CdpStoreKey, new CdpStore())
}

export function getCdpStore() {
  return getContext<ReturnType<typeof setCdpStore>>(CdpStoreKey)
}
