import type { ClaimNFT, CollateralizeDebtPositionData, CollateralResource, LoanResource, LSUResource } from '$lib/internal_modules/weft-ledger-state'
import type Decimal from 'decimal.js'
import type { MarketInfoStore } from './market-info.svelte'
import type { RadixToolkitStore } from './rdt.svelte'
import { CDP_RESOURCE, WeftLedgerSateFetcher } from '$lib/internal_modules/weft-ledger-state'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'
import { getMarketInfoStore } from './market-info.svelte'
import { getRadixToolkitStore } from './rdt.svelte'

export interface AccountDU {
  depositUnitAmount: Decimal
  loanResource: LoanResource
 }

 export interface AccountResource {
  amount: Decimal
  loanResource?: LoanResource
  collateralResource?: CollateralResource
 }

// export interface AccountClaimNFT {
//   resourceAddress: string
//   ids: string[]
//   metadata: Record<string, string>
//   validatorMetadata: Record<string, string>
//   validatorAddress: string
// }

export interface WeftUserAccountData {
  address: string
  cdps: CollateralizeDebtPositionData[]
  depositUnits: Record<string, AccountDU>
  resources: Record<string, AccountResource>
  lsu: Record<string, LSUResource>
  claimNFTs: Record<string, ClaimNFT>
}

export class UserAccountsStore extends BaseStore {
  accounts = $state<WeftUserAccountData[]>([])

  private rdtStore: RadixToolkitStore
  private marketInfoStore: MarketInfoStore
  private lastAccountAddresses: string[] = []

  weftStateApi: WeftLedgerSateFetcher

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()

    this.rdtStore = getRadixToolkitStore()
    this.marketInfoStore = getMarketInfoStore()

    this.startAutoRefresh(() => {
      if (this.rdtStore.walletData?.accounts?.length) {
        return this.loadAccounts()
      }
      else {
        this.accounts = []
      }
    }, 15 * 60 * 1000)

    // React to wallet account changes pushed from RadixToolkitStore.
    $effect(() => {
      const walletData = this.rdtStore.walletData
      const currentAccountAddresses = walletData?.accounts?.map(({ address }) => address) ?? []

      if (this.marketInfoStore?.loading) {
        return
      }

      // If no account are linked or Market info isn't initialized, reset account infos
      if (currentAccountAddresses.length === 0 || !this.marketInfoStore?.initialized) {
        this.accounts = []
        this.lastAccountAddresses = []
        return
      }

      const sortedAddresses = [...currentAccountAddresses].sort()
      const hasChanged = sortedAddresses.join(',') !== this.lastAccountAddresses.join(',')
      if (!hasChanged) {
        return
      }

      this.lastAccountAddresses = currentAccountAddresses

      this.loadAccounts()
    })

    // Cleanup handled by BaseStore.startAutoRefresh
  }

  async retry() {
    await this.loadAccounts()
  }

  async loadAccounts(force = false) {
    if (this.loading)
      return

    const accountAddresses = this.rdtStore.walletData?.accounts?.map(({ address }) => address) ?? []

    if (accountAddresses.length === 0) {
      this.accounts = []
      this.lastAccountAddresses = []
      return
    }

    const sortedAddresses = [...accountAddresses].sort()
    const lastSorted = [...this.lastAccountAddresses].sort()
    const unchanged = sortedAddresses.join(',') === lastSorted.join(',')
    if (!force && this.isDataFresh() && unchanged && this.accounts.length > 0)
      return

    const result = await this.executeWithErrorHandling(async () => {
      const res = await this.weftStateApi.getResourceInfos(accountAddresses)

      const accounts: WeftUserAccountData[] = []

      const tasks = Object.entries(res).map(async ([accountAddress, fetchedAccount]) => {
        const accountData: WeftUserAccountData = {
          address: accountAddress,
          cdps: [],
          depositUnits: {},
          resources: {},
          lsu: fetchedAccount.lsuResources.reduce<Record<string, LSUResource>>((a, b) => {
            a[b.resourceAddress] = b
            return a
          }, {}),
          claimNFTs: fetchedAccount.claimNfts.reduce<Record<string, ClaimNFT>>((a, b) => {
            a[b.resourceAddress] = b
            return a
          }, {}),
        }

        fetchedAccount.fungibleResources.forEach((fungibleResource) => {
          if (fungibleResource.amount.isZero())
            return

          const collateral = this.marketInfoStore.collateralResources.find(
            res => res.resourceAddress === fungibleResource.resourceAddress,
          )

          const loan = this.marketInfoStore.loanResources.find(
            res => res.resourceAddress === fungibleResource.resourceAddress,
          )

          const depositUnit = this.marketInfoStore.loanResources.find(
            res => res.lendingPoolState?.depositUnitAddress === fungibleResource.resourceAddress,
          )

          if (collateral || loan) {
            const accountResource: AccountResource = {
              loanResource: loan,
              collateralResource: collateral,
              amount: fungibleResource.amount,
            }

            accountData.resources[fungibleResource.resourceAddress] = accountResource
          }

          if (depositUnit) {
            const accountDU: AccountDU = {
              depositUnitAmount: fungibleResource.amount,
              loanResource: depositUnit,
            }

            accountData.depositUnits[fungibleResource.resourceAddress] = accountDU
          }
        })

        const cdpIds: string[] = []

        fetchedAccount.nonFungibleResources.forEach((claimNft) => {
         const ids = claimNft.ids ?? []

          if (ids.length === 0) {
            return
          }

          if (claimNft.resourceAddress === CDP_RESOURCE) {
            cdpIds.push(...ids)
          }
        })

        accountData.cdps = (await this.weftStateApi.getMultipleCdp(cdpIds)).data

        accounts.push(accountData)
      })

      await Promise.all(tasks)

      return { accounts, accountAddresses }
    }, 'loadAccounts')

    if (result) {
      this.accounts = result.accounts
      this.lastAccountAddresses = result.accountAddresses
    }
    else {
      this.accounts = []
    }
  }
}

const UserAccountsStoreKey = Symbol('UserAccountsStore')

export function setUserAccountsStore() {
  return setContext(UserAccountsStoreKey, new UserAccountsStore())
}

export function getUserAccountsStore() {
  return getContext<ReturnType<typeof setUserAccountsStore>>(UserAccountsStoreKey)
}
