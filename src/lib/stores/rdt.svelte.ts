import type { WalletDataState } from '@radixdlt/radix-dapp-toolkit'
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'
import { DataRequestBuilder, RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'
import { getContext, onDestroy, setContext } from 'svelte'

export class RadixToolkitStore {
rdt: RadixDappToolkit
	gatewayApi: GatewayApiClient
	walletData = $state<WalletDataState | undefined>()
	walletConnected = $derived(!!this.walletData?.accounts[0])
	selectedAccount = $state('')

	constructor() {
		this.rdt = RadixDappToolkit({
			networkId: RadixNetwork.Mainnet,
			applicationVersion: '1.0.0',
			applicationName: 'Hello Token dApp',
			applicationDappDefinitionAddress:
				'account_rdx168r05zkmtvruvqfm4rfmgnpvhw8a47h6ln7vl3rgmyrlzmfvdlfgcg',
		})

		// Initialize the Gateway API for network queries
		this.gatewayApi = GatewayApiClient.initialize(this.rdt.gatewayApi.clientConfig)

		// Fetch the user's account address(es) from the wallet
		this.rdt?.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))

		// Subscribe to updates to the user's shared wallet data and store it in the walletData store
		const subs = this.rdt?.walletApi.walletData$.subscribe((data) => {
			// $effect(() => {
			//   $inspect('walletConnected: ', this.walletConnected)
			// })

			this.walletData = data

			if (!this.walletConnected) {
				this.selectedAccount = ''
			}
		})

		onDestroy(() => {
			subs.unsubscribe()
		})
	}
}

const RDT_KEY = Symbol('RadixToolkitStore')

export function setRadixToolkitStore() {
	return setContext(RDT_KEY, new RadixToolkitStore())
}

export function getRadixToolkitStore() {
	return getContext<ReturnType<typeof setRadixToolkitStore>>(RDT_KEY)
}
