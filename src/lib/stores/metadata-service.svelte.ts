import type { LedgerStateSelector, StateEntityDetailsResponseItemDetails } from '@radixdlt/babylon-gateway-api-sdk'
import { toCamelCase } from '$lib/internal_modules/state-fetcher'
import { WeftLedgerSateFetcher } from '$lib/internal_modules/weft-ledger-state'
import { getContext, setContext } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'

type A = StateEntityDetailsResponseItemDetails
  & {
    type: 'FungibleResource' | 'NonFungibleResource'
    resourceAddress: string
    metadata: Record<string, any>
    validatorMetadata?: Record<string, any> | undefined
  }

interface CacheStrategy {
  get: (key: string) => A | undefined
  set: (key: string, value: A) => void
  has: (key: string) => boolean
  clear: () => void
}

class InMemoryCacheStrategy implements CacheStrategy {
  private cache: Map<string, A> = new Map()

  get(key: string): A | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: A): void {
    this.cache.set(key, value)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

class LocalStorageCacheStrategy implements CacheStrategy {
  private readonly prefix = 'weft_metadata_'
  private readonly ttl: number

  constructor(ttlMs = 3600000) { // 1 hour default
    this.ttl = ttlMs
  }

  get(key: string): A | undefined {
    if (typeof localStorage === 'undefined')
      return undefined

    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item)
        return undefined

      const parsed = JSON.parse(item)
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(this.prefix + key)
        return undefined
      }

      return parsed.value
    }
    catch {
      return undefined
    }
  }

  set(key: string, value: A): void {
    if (typeof localStorage === 'undefined')
      return

    try {
      const item = {
        value,
        expiry: Date.now() + this.ttl,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    }
    catch {
      // Silent fail if localStorage is full or unavailable
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  clear(): void {
    if (typeof localStorage === 'undefined')
      return

    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key)
      }
    }
    catch {
      // Silent fail
    }
  }
}

export class MetadataService {
  resourceInfoState: Map<string, A> = new SvelteMap()

  private cacheStrategy: CacheStrategy
  private validatorMetadataCache: Map<string, Record<string, any>> = new Map()

  weftStateApi: WeftLedgerSateFetcher

  constructor(useLocalStorage = false, ttlMs?: number) {
    this.weftStateApi = WeftLedgerSateFetcher.getInstance()

    this.cacheStrategy = useLocalStorage
      ? new LocalStorageCacheStrategy(ttlMs)
      : new InMemoryCacheStrategy()
  }

// getSyncResourceDetails(resourceAddress: string): A | undefined {
//   const result = this.resourceInfoState.get(resourceAddress)
//   if (!result) {
//     this.getResourceDetails([resourceAddress])
//   }

//   return result
// }

  async getResourceDetails(resources: string[], ledgerStateSelector?: LedgerStateSelector): Promise<A[]> {
    const entityAddresses = [...new Set(resources)]
    const returnedResult: A[] = []
    const resourcesToFetch: string[] = []

    // Check cache first
    for (const address of entityAddresses) {
      const cached = this.cacheStrategy.get(address)
      if (cached) {
        returnedResult.push(cached)
      }
      else {
        resourcesToFetch.push(address)
      }
    }

    // If all resources are cached, return early
    if (resourcesToFetch.length === 0) {
      return returnedResult
    }

    const batchSize = 20
    const batches: string[][] = []

    for (let i = 0; i < resourcesToFetch.length; i += batchSize) {
      batches.push(resourcesToFetch.slice(i, i + batchSize))
    }

    const results = await Promise.all(
      batches.map(batch =>
        this.weftStateApi.getGatewayApi().state.innerClient.stateEntityDetails({
          stateEntityDetailsRequest: {
            at_ledger_state: ledgerStateSelector,
            addresses: batch,
            aggregation_level: 'Global',
            opt_ins: {
              native_resource_details: true,
            },
          },
        }),
      ),
    )

    // this.stateFetcher.apiCallCount += batches.length

    for (const result of results) {
      for (const resourceState of result.items) {
        if (resourceState.details?.type === 'FungibleResource' || resourceState.details?.type === 'NonFungibleResource') {
          const metadata: Record<string, any> = {}

          resourceState.metadata.items.forEach(async (item) => {
            metadata[toCamelCase(item.key)] = (item.value.typed as any)?.value ?? (item.value.typed as any)?.values
          })

          const resourceInfo: A = {
            ...resourceState.details,
            resourceAddress: resourceState.address,
            metadata,
          }

          // Update state (but not cache yet - cache will be updated after validator metadata is fetched)
          this.resourceInfoState.set(resourceState.address, resourceInfo)
          returnedResult.push(resourceInfo)
        }
      }
    }

    // Collect validator addresses to fetch
    const validatorAddressesToFetch = new Set<string>()

    returnedResult.forEach((r) => {
      if (r.native_resource_details?.kind === 'ValidatorClaimNft' || r.native_resource_details?.kind === 'ValidatorLiquidStakeUnit') {
        const validatorAddress = r.native_resource_details.validator_address

        // Check if validator metadata is already cached
        if (this.validatorMetadataCache.has(validatorAddress)) {
          r.validatorMetadata = this.validatorMetadataCache.get(validatorAddress)
        }
        else {
          validatorAddressesToFetch.add(validatorAddress)
        }
      }
    })

    // Only fetch validator metadata if we have uncached validator addresses
    if (validatorAddressesToFetch.size > 0) {
      const res = await this.weftStateApi.getFetcher().fetchEntityState([...validatorAddressesToFetch], {
        loadState: true,
        loadResourceDetails: false,
        recursiveFungibleResourceLoading: false,
        recursiveNonFungibleResourceLoading: false,
      })

      res.forEach((state) => {
        // Cache the validator metadata
        this.validatorMetadataCache.set(state.$entityAddress, state.$metadata)

        // Update ALL resources that belong to this validator (not just the first one)
        returnedResult.forEach((resource) => {
          if ((resource.native_resource_details?.kind === 'ValidatorLiquidStakeUnit' || resource.native_resource_details?.kind === 'ValidatorClaimNft')
            && resource.native_resource_details?.validator_address === state.$entityAddress) {
            resource.validatorMetadata = state.$metadata
          }
        })
      })
    }

    // Cache all newly fetched resources after validator metadata has been added
    for (const address of resourcesToFetch) {
      const resource = returnedResult.find(r => r.resourceAddress === address)

      if (resource) {
        this.cacheStrategy.set(address, resource)
      }
    }

    return returnedResult
  }

  /**
   * Get a single resource from cache or state
   */
  getResourceFromCache(resourceAddress: string): A | undefined {
    return this.resourceInfoState.get(resourceAddress) ?? this.cacheStrategy.get(resourceAddress)
  }

  /**
   * Clear all cached resources and validator metadata
   */
  clearCache(): void {
    this.resourceInfoState.clear()
    this.cacheStrategy.clear()
    this.validatorMetadataCache.clear()
  }

  /**
   * Get all resources from state
   */
  getAllResourcesFromState(): A[] {
    return Array.from(this.resourceInfoState.values())
  }
}

const MetadataServiceKey = Symbol('MetadataServiceKey')

export function setMetadataService() {
  return setContext(MetadataServiceKey, new MetadataService())
}

export function getMetadataService() {
  return getContext<ReturnType<typeof setMetadataService>>(MetadataServiceKey)
}
