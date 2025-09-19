import type { LedgerStateSelector } from '@radixdlt/babylon-gateway-api-sdk'
import type Decimal from 'decimal.js'
import { dec, WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { getContext, onDestroy, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

interface Prices {
  current: Decimal
  previous: Decimal
}

export class PriceStore extends BaseStore {
  async retry(): Promise<void> {
    await this.loadPrices()
  }

  prices: Record<string, Prices> = $state({})
  updaterTimer: ReturnType<typeof setInterval> | undefined
  lastRequestedAddresses: string[] = []

  weftStateApi: WeftLedgerSateFetcher

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()

    this.updaterTimer = setInterval(
      () => {
        if (this.lastRequestedAddresses.length === 0)
          return

        void this.loadPrices()
      },
      15 * 60 * 1000,
    )

    onDestroy(() => {
      if (this.updaterTimer)
        clearInterval(this.updaterTimer)
    })
  }

  async loadPrices(addresses: string[] = []) {
    const existingAddresses = Object.keys(this.prices)
    const baseAddresses = addresses.length > 0 ? addresses : this.lastRequestedAddresses
    const mergedAddresses = [...new Set([
      ...existingAddresses,
      ...this.lastRequestedAddresses,
      ...baseAddresses,
    ])]

    if (mergedAddresses.length === 0)
      return

    this.lastRequestedAddresses = mergedAddresses

    await this.executeWithErrorHandling(
      async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const ledgerStateSelector: LedgerStateSelector = { timestamp: yesterday }

        const [prices, yesterdayPrices] = await Promise.all([
          this.weftStateApi.getPrice(mergedAddresses),
          this.weftStateApi.getPriceAtLedgerState(mergedAddresses, ledgerStateSelector),
        ])

        const previousPriceMap = new Map(yesterdayPrices.map(price => [price.resourceAddress, price.price]))
        const nextPrices: Record<string, Prices> = { ...this.prices }

        for (const currentPrice of prices) {
          const previousPrice = previousPriceMap.get(currentPrice.resourceAddress) ?? currentPrice.price

          nextPrices[currentPrice.resourceAddress] = {
            current: currentPrice.price,
            previous: previousPrice,
          }
        }

        this.prices = nextPrices
      },
      'loadPrices',
    )
  }

  getPrice(
    address: string,
  ): Prices {
    const prices = (this.prices[address] ?? { current: dec(0), previous: dec(0) })

    return prices
  }
}

const PriceStoreKey = Symbol('PriceStoreKey')

export function setPriceStore() {
  return setContext(PriceStoreKey, new PriceStore())
}

export function getPriceStore() {
  return getContext<ReturnType<typeof setPriceStore>>(PriceStoreKey)
}
