import type { ClaimNFTCollateral, CollateralizeDebtPositionData, CollateralResource, FetchOptions, LoanResource, LSUCollateral } from '$lib/internal_modules/dist'
import type Decimal from 'decimal.js'
import type { MarketInfoStore } from './market-info.svelte'
import type { RadixToolkitStore } from './rdt.svelte'
import { CDP_RESOURCE, dec, WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { getContext, onDestroy, setContext } from 'svelte'
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

export interface AccountClaimNFT {
  resourceAddress: string
  ids: string[]
  metadata: Record<string, string>
  validatorMetadata: Record<string, string>
  validatorAddress: string
}

export interface WeftUserAccountData {
  address: string
  cdps: CollateralizeDebtPositionData[]
  depositUnits: Record<string, AccountDU>
  resources: Record<string, AccountResource>
  lsu: Record<string, LSUCollateral>
  claimNFTs: Record<string, AccountClaimNFT>
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

    const updaterTimer = setInterval(() => {
      if (this.rdtStore.walletData?.accounts?.length) {
        void this.loadAccounts()
      }
      else {
        this.accounts = []
      }
    }, 15 * 60 * 1000)

    // React to wallet account changes pushed from RadixToolkitStore.
    $effect(() => {
      $inspect(this.accounts)

      const walletData = this.rdtStore.walletData
      const currentAccountAddresses = walletData?.accounts?.map(({ address }) => address) ?? []

      if (this.marketInfoStore.loading) {
        return
      }

      // If no account are linked or Market info isn't initialized, reset account infos
      if (currentAccountAddresses.length === 0 || !this.marketInfoStore.initialized) {
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

    onDestroy(() => {
      clearInterval(updaterTimer)
    })
  }

  async retry() {
    await this.loadAccounts()
  }

  async loadAccounts() {
    const accountAddresses = this.rdtStore.walletData?.accounts?.map(({ address }) => address) ?? []

    this.accounts = []
    this.lastAccountAddresses = []

    if (accountAddresses.length === 0) {
      return
    }

    try {
      const options: FetchOptions = {
        loadState: false,
        loadResourceDetails: true,
        recursiveFungibleResourceLoading: true,
        recursiveNonFungibleResourceLoading: true,
      }

      const res = await this.weftStateApi.getFetcher().fetchEntityState(accountAddresses, options)

      const accounts: WeftUserAccountData[] = []

      const tasks = res.map(async (fetchedAccount) => {
        const accountData: WeftUserAccountData = {
          address: fetchedAccount.$entityAddress,
          cdps: [],
          depositUnits: {},
          resources: {},
          lsu: {},
          claimNFTs: {},
        }

        Object.entries(fetchedAccount.$fungibleResources.values).forEach(([address, fungibleResource]) => {
          if (fungibleResource.amount.isZero())
            return

          const collateral = this.marketInfoStore.collateralResources.find(
            res => res.resourceAddress === address,
          )

          const loan = this.marketInfoStore.loanResources.find(
            res => res.resourceAddress === address,
          )

          const depositUnit = this.marketInfoStore.loanResources.find(
            res => res.lendingPoolState?.depositUnitAddress === address,
          )

          const lsu = this.marketInfoStore.lsuAmounts.find(
            res => res.resourceAddress === address,
          )

          if (collateral || loan) {
            const accountResource: AccountResource = {
              loanResource: loan,
              collateralResource: collateral,
              amount: fungibleResource.amount,
            }

            accountData.resources[address] = accountResource
          }

          if (depositUnit) {
            const accountDU: AccountDU = {
              depositUnitAmount: fungibleResource.amount,
              loanResource: depositUnit,
            }

            accountData.depositUnits[address] = accountDU
          }

          if (lsu) {
            const accountLSU: LSUCollateral = { ...lsu, amount: fungibleResource.amount }
            accountData.lsu[address] = accountLSU
          }
          else if (fungibleResource.fungibleDetails?.$details.native_resource_details?.kind === 'ValidatorLiquidStakeUnit') {
            accountData.lsu[address] = {
              amount: fungibleResource.amount,
              resourceAddress: address,
              unitRedemptionValue: dec(fungibleResource.fungibleDetails?.$details.native_resource_details?.unit_redemption_value[0].amount ?? dec(0)),
              validatorAddress: fungibleResource.fungibleDetails?.$details.native_resource_details?.validator_address,
              metadata: fungibleResource.fungibleDetails?.$metadata,
              validatorMetadata: {},
          }
          }
        })

        const cdpIds: string[] = []

        Object.entries(fetchedAccount.$nonFungibleResources.values).forEach(([address, nonFungibleResource]) => {
         const ids = nonFungibleResource.ids ?? []

          if (ids.length === 0) {
            return
          }

          if (address === CDP_RESOURCE) {
            cdpIds.push(...ids)
          }

          const claimNft = this.marketInfoStore.claimNftCollaterals.find(
            res => res.resourceAddress === address,
          )
          //
          if (claimNft) {
            const accountClaimNFT: ClaimNFTCollateral = { ...claimNft, ids }
            accountData.claimNFTs[address] = accountClaimNFT
          }
          else if (nonFungibleResource.nonFungibleDetails?.$details.native_resource_details?.kind === 'ValidatorClaimNft') {
            accountData.claimNFTs[address] = {
              ids,
              resourceAddress: address,
              validatorAddress: nonFungibleResource.nonFungibleDetails?.$details.native_resource_details?.validator_address,
              metadata: nonFungibleResource.nonFungibleDetails?.$metadata,
              validatorMetadata: {},
            }
          }
        })

        accountData.cdps = (await this.weftStateApi.getMultipleCdp(cdpIds)).data

        accounts.push(accountData)
      })

      await Promise.all(tasks)

      this.accounts = accounts
    }
    catch (error) {
      console.error('Failed to load account data:', error)
      this.accounts = []
    }
  }
}

const UserAccountsStoreKey = Symbol('MarketInfoStore')

export function setUserAccountsStore() {
  return setContext(UserAccountsStoreKey, new UserAccountsStore())
}

export function getUserAccountsStore() {
  return getContext<ReturnType<typeof setUserAccountsStore>>(UserAccountsStoreKey)
}
