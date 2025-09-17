import type { CollateralizeDebtPositionData } from '$lib/internal_modules/dist'
import { WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

export class CdpStore extends BaseStore {
  cdpList: CollateralizeDebtPositionData[] = $state([])
  cdpLoadingState: { total: number, loaded: number } | undefined = $state()
  cdpIds: any[] = $state([])
  filteredCdpList: CollateralizeDebtPositionData[] = $state([])

  weftStateApi: WeftLedgerSateFetcher
  updaterTimer: number | undefined

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()
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

        this.cdpLoadingState = { total: AllIds.length, loaded: 0 }

        const ids = AllIds.map(a => a.non_fungible_id)

        // Fetch multiple CDP data
        const list = await WeftLedgerSateFetcher.getInstance().getMultipleCdp(ids, {
          onProgress: (newlyFetched) => {
            this.cdpLoadingState!.loaded += newlyFetched
          },
        })

        this.cdpLoadingState = undefined

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

  // Filter to show only CDPs with loan positions
  private filterActiveCdps() {
    this.filteredCdpList = this.cdpList.filter((cdp) => {
      const hasLoans = Object.keys(cdp.loanPositions || {}).length > 0
      return hasLoans
    })
  }

  onDestroy() {
    if (this.updaterTimer) {
      clearInterval(this.updaterTimer)
    }
  }
}

export function inEfficiency(cdp?: CollateralizeDebtPositionData): boolean {
  if (!cdp)
    return false

  const collateralPositions = [
    ...Object.values(cdp?.collateralPositions || []),
    ...Object.values(cdp?.nftCollateralPositions || {}).flatMap(nftPos => Object.values((nftPos).underlyingPositions || {})),
  ]

  return collateralPositions.reduce((acc, collateralPosition) => acc || collateralPosition.configVersion.efficiencyMode.variantId !== '0', false)
}

const CdpStoreKey = Symbol('CdpStore')

export function setCdpStore() {
  return setContext(CdpStoreKey, new CdpStore())
}

export function getCdpStore() {
  return getContext<ReturnType<typeof setCdpStore>>(CdpStoreKey)
}
