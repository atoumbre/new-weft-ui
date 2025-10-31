import type { ClaimNFT, FungibleResource, LSUResource, NonFungibleResource } from '$lib/internal_modules/weft-ledger-state'
import type { LedgerStateSelector } from '@radixdlt/babylon-gateway-api-sdk'
import type Decimal from 'decimal.js'
import { LENDING_MARKET_COMPONENT, WeftLedgerSateFetcher } from '$lib/internal_modules/weft-ledger-state'
import { dec } from '$lib/utils/common'
import { getContext, onDestroy, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

interface MarketResourceInfo {
  fungibleResources: FungibleResource[]
  lsuResources: LSUResource[]
  claimNfts: ClaimNFT[]
  nonFungibleResources: NonFungibleResource[]
}

export class MarketResourceStore extends BaseStore {
  updaterTimer: ReturnType<typeof setInterval> | undefined
  weftStateApi: WeftLedgerSateFetcher

  totalCollateral = $derived.by(() => {
    return this.resourceInfo.fungibleResources.reduce<Decimal>((acc, item) => {
      return acc.add(item.amount)
    }, dec(0))
  })

  totalLsuCollateral = $derived.by(() => {
    return this.resourceInfo.lsuResources.reduce<Decimal>((acc, item) => {
      return acc.add(item.amount.mul(item.unitRedemptionValue))
    }, dec(0))
  })

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 10 * 60 * 1000, // 10 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()

    if (typeof window !== 'undefined') {
      this.updaterTimer = setInterval(
        () => {
          void this.loadResourceInfo()
        },
        15 * 60 * 1000, // 15 minutes
      )
    }

    onDestroy(() => {
      if (this.updaterTimer)
        clearInterval(this.updaterTimer)
    })
  }

  async retry(): Promise<void> {
    await this.loadResourceInfo()
  }

  resourceInfo: MarketResourceInfo = $state({
    fungibleResources: [],
    lsuResources: [],
    claimNfts: [],
    nonFungibleResources: [],
  })

  async loadResourceInfo(ledgerStateSelector?: LedgerStateSelector, force = false) {
    if (this.loading)
      return

    // Check if data is still fresh
    if (!force && this.isDataFresh() && this.resourceInfo.fungibleResources.length > 0) {
      return
    }

    await this.executeWithErrorHandling(async () => {
      const resourceInfo = await this.weftStateApi.getResourceInfos([LENDING_MARKET_COMPONENT], ledgerStateSelector)
      this.resourceInfo = resourceInfo[LENDING_MARKET_COMPONENT]
    }, 'loadResourceInfo')
  }

  /**
   * Get all fungible collaterals
   */
  getFungibleCollaterals(): FungibleResource[] {
    return this.resourceInfo.fungibleResources
  }

  /**
   * Get all LSU (Liquid Staking Unit) collaterals
   */
  getLSUCollaterals(): LSUResource[] {
    return this.resourceInfo.lsuResources
  }

  /**
   * Get all Claim NFT collaterals
   */
  getClaimNFTCollaterals(): ClaimNFT[] {
    return this.resourceInfo.claimNfts
  }

  // /**
  //  * Get all collaterals in a single array
  //  */
  // getAllCollaterals(): (FungibleResource | LSUCollateral | ClaimNFTCollateral)[] {
  //   return [
  //     ...this.resourceInfo.fungibleResource,
  //     ...this.resourceInfo.lsuResources,
  //     ...this.resourceInfo.claimNfts,
  //   ]
  // }

  // /**
  //  * Find a fungible collateral by resource address
  //  */
  // findFungibleCollateral(resourceAddress: string): FungibleResource | undefined {
  //   return this.resourceInfo.fungibleResources.find(
  //     collateral => collateral.resourceAddress === resourceAddress,
  //   )
  // }

  // /**
  //  * Find an LSU collateral by resource address
  //  */
  // findLSUCollateral(resourceAddress: string): LSUResource | undefined {
  //   return this.resourceInfo.lsuResources.find(
  //     collateral => collateral.resourceAddress === resourceAddress,
  //   )
  // }

  // /**
  //  * Find a Claim NFT collateral by resource address
  //  */
  // findClaimNFTCollateral(resourceAddress: string): ClaimNFT | undefined {
  //   return this.resourceInfo.claimNfts.find(
  //     collateral => collateral.resourceAddress === resourceAddress,
  //   )
  // }

  // /**
  //  * Find any collateral by resource address
  //  */
  // findCollateral(resourceAddress: string): FungibleResource | LSUResource | ClaimNFT | undefined {
  //   return (
  //     this.findFungibleCollateral(resourceAddress)
  //     || this.findLSUCollateral(resourceAddress)
  //     || this.findClaimNFTCollateral(resourceAddress)
  //   )
  // }

  // /**
  //  * Get collaterals by validator address (for LSU and Claim NFT collaterals)
  //  */
  // getCollateralsByValidator(validatorAddress: string): (LSUCollateral | ClaimNFTCollateral)[] {
  //   const lsuCollaterals = this.resourceInfo.lsuResources.filter(
  //     collateral => collateral.validatorAddress === validatorAddress,
  //   )
  //   const claimNftCollaterals = this.resourceInfo.claimNfts.filter(
  //     collateral => collateral.validatorAddress === validatorAddress,
  //   )

  //   return [...lsuCollaterals, ...claimNftCollaterals]
  // }

  /**
   * Check if resource info has been loaded
   */
  get hasResourceInfo(): boolean {
    return this.resourceInfo.fungibleResources.length > 0
      || this.resourceInfo.lsuResources.length > 0
      || this.resourceInfo.claimNfts.length > 0
  }

  /**
   * Get total number of collaterals
   */
  get totalCollateralsCount(): number {
    return (
      this.resourceInfo.fungibleResources.length
      + this.resourceInfo.lsuResources.length
      + this.resourceInfo.claimNfts.length
    )
  }
}

const ComponentResourceStoreKey = Symbol('MarketResourceStore')

export function setMarketResourceStore() {
  return setContext(ComponentResourceStoreKey, new MarketResourceStore())
}

export function getMarketResourceStore() {
  return getContext<ReturnType<typeof setMarketResourceStore>>(ComponentResourceStoreKey)
}
