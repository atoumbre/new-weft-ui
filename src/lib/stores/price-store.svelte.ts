import type Decimal from 'decimal.js'

import { dec, WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { getContext, setContext } from 'svelte'
import { BaseStore } from './base-store.svelte'

export class PriceStore extends BaseStore {
	async retry(): Promise<void> {
		await this.loadResourceState(Object.keys(this.resourceData))
	}

	weftStateApi: WeftLedgerSateFetcher

	resourceData: Record<string, Decimal> = $state({})

	updater: number

	constructor() {
		super({
			autoRetry: true,
			maxRetries: 3,
			retryDelay: 2000, // 2 seconds
			cacheTTL: 5 * 60 * 1000, // 5 minutes
		})

		this.updater = setTimeout(
			() => {
				this.loadResourceState(Object.keys(this.resourceData))
			},
			15 * 60 * 1000,
		)

		this.weftStateApi = WeftLedgerSateFetcher.getInstance()
	}

	async loadResourceState(newAddresses: string[] = []) {
		const addresses = [...new Set([...Object.keys(this.resourceData), ...newAddresses])]

		this.weftStateApi
			.getPrice(addresses)

			.then((prices) => {
				this.resourceData = prices.reduce((a, b) => {
					return {
						...a,
						[b.resourceAddress]: b.price,
					}
				}, this.resourceData)
			})
	}

	getFungibleResourceState(
		address: string,
	): Decimal {
		return this.resourceData[address] ?? dec(0)
	}
}

const ResourceInfoStoreKey = 'ResourceInfoStore'

export function setResourceInfoStore() {
	return setContext(ResourceInfoStoreKey, new PriceStore())
}

export function getResourceInfoStore() {
	return getContext<ReturnType<typeof setResourceInfoStore>>(ResourceInfoStoreKey)
}
