import type { LedgerStateSelector } from '@radixdlt/babylon-gateway-api-sdk'
import type Decimal from 'decimal.js'
import type { XRDPriceStore } from './xrd-price-store.svelte'
import { WeftLedgerSateFetcher } from '$lib/internal_modules/weft-ledger-state'
import { dec } from '$lib/utils/common'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'
import { getXRDPriceStore } from './xrd-price-store.svelte'

interface Prices {
  current: Decimal
  previous: Decimal
}

export class PriceStore extends BaseStore {
  async retry(): Promise<void> {
    await this.loadPrices()
  }

  prices: Record<string, Prices> = $state({})
  lastRequestedAddresses: string[] = []

  weftStateApi: WeftLedgerSateFetcher
  private xrdPriceStore: XRDPriceStore

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.weftStateApi = WeftLedgerSateFetcher.getInstance()
        this.xrdPriceStore = getXRDPriceStore()

    this.startAutoRefresh(() => {
      if (this.lastRequestedAddresses.length === 0)
        return
      return this.loadPrices()
    }, 15 * 60 * 1000)
  }

  async loadPrices(addresses: string[] = [], force = false) {
    if (this.loading)
      return

    const existingAddresses = Object.keys(this.prices)
    const baseAddresses = addresses.length > 0 ? addresses : this.lastRequestedAddresses
    const mergedAddresses = [
      ...new Set([...existingAddresses, ...this.lastRequestedAddresses, ...baseAddresses]),
    ]

    if (mergedAddresses.length === 0)
      return

    this.lastRequestedAddresses = mergedAddresses

    if (!force && this.isDataFresh() && mergedAddresses.every(addr => !!this.prices[addr]))
      return

    await this.executeWithErrorHandling(async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const ledgerStateSelector: LedgerStateSelector = { timestamp: yesterday }

      const [prices, yesterdayPrices] = await Promise.all([
        this.weftStateApi.getPrice(mergedAddresses),
        this.weftStateApi.getPrice(mergedAddresses, ledgerStateSelector),
      ])

      const previousPriceMap = new Map(
        yesterdayPrices.map(price => [price.resourceAddress, price.price]),
      )
      const nextPrices: Record<string, Prices> = { ...this.prices }

      for (const currentPrice of prices) {
        const previousPrice
          = previousPriceMap.get(currentPrice.resourceAddress) ?? currentPrice.price

        nextPrices[currentPrice.resourceAddress] = {
          current: currentPrice.price,
          previous: previousPrice,
        }
      }

      this.prices = nextPrices
    }, 'loadPrices')
  }

  getPrice(address: string): Prices {
    const prices = this.prices[address] ?? { current: dec(0), previous: dec(0) }

    return prices
  }

  buildPrice(address: string) {
    const { current, previous } = this.getPrice(address)
    const priceUsd = this.xrdPriceStore.xrdPrice.mul(current)
    const previousPriceUsd = this.xrdPriceStore.xrdPreviousPrice.mul(previous)
    const changePct = previousPriceUsd.isZero()
      ? null
      : priceUsd.sub(previousPriceUsd).div(previousPriceUsd).mul(100)
    return { priceUsd, previousPriceUsd, changePct }
  }
}

const PriceStoreKey = Symbol('PriceStoreKey')

export function setPriceStore() {
  return setContext(PriceStoreKey, new PriceStore())
}

export function getPriceStore() {
  return getContext<ReturnType<typeof setPriceStore>>(PriceStoreKey)
}
