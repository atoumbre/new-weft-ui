import { dec, WeftLedgerSateFetcher, type ResourceState } from '$lib/internal_modules/dist';

import type Decimal from 'decimal.js';
import { getContext, setContext } from 'svelte';
import { BaseStore } from './base-store.svelte';

export type AppResourceState = {
	resourceState: ResourceState,
	price?: Decimal
}

export class ResourceInfoStore extends BaseStore {
	async retry(): Promise<void> {
		await this.loadResourceState(Object.keys(this.resourceData))
	}

	weftStateApi: WeftLedgerSateFetcher;

	resourceData: Record<string, AppResourceState> = $state({});

	updater: number;

	constructor() {

		super({
			autoRetry: true,
			maxRetries: 3,
			retryDelay: 2000, // 2 seconds
			cacheTTL: 5 * 60 * 1000 // 5 minutes
		});

		this.updater = setTimeout(
			() => {
				this.loadResourceState(Object.keys(this.resourceData));
			},
			15 * 60 * 1000
		);

		this.weftStateApi = WeftLedgerSateFetcher.getInstance()
	}

	async loadResourceState(newAddresses: string[] = []) {

		const addresses = [...new Set([...Object.keys(this.resourceData), ...newAddresses])]

		Promise.all([
			this.weftStateApi
				.getFetcher()
				.fetchResourceState(addresses),

			this.weftStateApi
				.getPriceAtLedgerState(addresses),
		])
			.then(([res, prices]) => {


				this.resourceData = res.reduce((a, b) => {
					return {
						...a,
						[b.$entityAddress]: {
							resourceState: b,
							price: prices.find((price) => price.resourceAddress === b.$entityAddress)?.price ?? dec(0)
						}
					};
				}, this.resourceData);




			});


	}

	getFungibleResourceState(
		address: string
	): AppResourceState {
		const state = this.resourceData[address];
		if (state?.resourceState.$type === 'FungibleResource') {
			return state;
		} else {
			return undefined;
		}
	}
}

const ResourceInfoStoreKey = 'ResourceInfoStore';

export function setResourceInfoStore() {
	return setContext(ResourceInfoStoreKey, new ResourceInfoStore());
}

export function getResourceInfoStore() {
	return getContext<ReturnType<typeof setResourceInfoStore>>(ResourceInfoStoreKey);
}
