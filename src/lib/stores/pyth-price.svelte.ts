import type Decimal from 'decimal.js'
import { dec } from '$lib/utils'
import { HermesClient } from '@pythnetwork/hermes-client'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

const priceIds = [
	'0x816c6604beb161d3ad9c3b584f06c682e6299516165d756a68c7660b073b7072', // BTC/USD price id
]

export class PythPriceStore extends BaseStore {
	async retry(): Promise<void> {
		await this.updatePrice()
	}

	updaterTimer: number | undefined
	xrdPrice: Decimal = $state(dec(0))

	connection = new HermesClient('https://hermes.pyth.network', {}) // See Hermes endpoints section below for other endpoints

	constructor() {
		super({
			autoRetry: true,
			maxRetries: 3,
			retryDelay: 2000, // 2 seconds
			cacheTTL: 5 * 60 * 1000, // 5 minutes
		})

		this.updaterTimer = setInterval(
			() => {
				this.updatePrice()
			},
			15 * 60 * 1000,
		)
	}

	async updatePrice() {
		const priceUpdate = ((await this.connection.getLatestPriceUpdates(priceIds)).parsed ?? [])[0]

		this.xrdPrice = dec(priceUpdate.price.price).mul(dec(10).pow(priceUpdate.price.expo))
	}

	onDestroy() {
		if (this.updaterTimer)
clearTimeout(this.updaterTimer)
	}
}

const PythPriceStoreKey = 'PythPriceStoreKey'

export function setPythPriceStore() {
	return setContext(PythPriceStoreKey, new PythPriceStore())
}

export function getPythPriceStore() {
	return getContext<ReturnType<typeof setPythPriceStore>>(PythPriceStoreKey)
}
