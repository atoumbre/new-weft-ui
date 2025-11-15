import type Decimal from 'decimal.js'
import { dec } from '$lib/utils/common'
import { HermesClient } from '@pythnetwork/hermes-client'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

const priceIds = ['0x816c6604beb161d3ad9c3b584f06c682e6299516165d756a68c7660b073b7072']

export class XRDPriceStore extends BaseStore {
  async retry(): Promise<void> {
    await this.updatePrice()
  }

  xrdPrice: Decimal = $state(dec(0))
  xrdPreviousPrice: Decimal = $state(dec(0))

  connection = new HermesClient('https://hermes.pyth.network', {}) // See Hermes endpoints section below for other endpoints

  constructor() {
    super({
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    })

    this.startAutoRefresh(() => this.updatePrice(), 15 * 60 * 1000)
  }

  async updatePrice(force = false) {
    if (this.loading)
      return

    if (!force && this.isDataFresh())
      return

    await this.executeWithErrorHandling(async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const unixTimestamp = Math.floor(yesterday.getTime() / 1000)

      const [latestResponse, previousResponse] = await Promise.all([
        this.connection.getLatestPriceUpdates(priceIds),
        this.connection.getPriceUpdatesAtTimestamp(unixTimestamp, priceIds),
      ])

      const latestUpdate = latestResponse.parsed?.[0]
      if (!latestUpdate)
        throw new Error('Latest price update missing for configured price id')

      const currentPrice = dec(latestUpdate.price.price).mul(dec(10).pow(latestUpdate.price.expo))
      this.xrdPrice = currentPrice

      const previousUpdate = previousResponse.parsed?.[0]
      if (previousUpdate) {
        this.xrdPreviousPrice = dec(previousUpdate.price.price).mul(
          dec(10).pow(previousUpdate.price.expo),
        )
      }
      else {
        this.xrdPreviousPrice = currentPrice
      }
    }, 'updatePrice')
  }
}

const XRDPriceStoreKey = Symbol('XRDPriceStoreKey')

export function setXRDPriceStore() {
  return setContext(XRDPriceStoreKey, new XRDPriceStore())
}

export function getXRDPriceStore() {
  return getContext<ReturnType<typeof setXRDPriceStore>>(XRDPriceStoreKey)
}
