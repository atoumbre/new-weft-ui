import type { WalletDataState } from '@radixdlt/radix-dapp-toolkit'
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'
import { DataRequestBuilder, RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'
import { getContext, onDestroy, setContext } from 'svelte'

export class RadixToolkitStore {
  innerRDT?: RadixDappToolkit
  innerGatewayApi?: GatewayApiClient
  walletData = $state<WalletDataState | undefined>()
  walletConnected = $derived(!!this.walletData?.accounts[0])
  selectedAccount = $state('')

  init() {
    this.innerRDT = RadixDappToolkit({
      networkId: RadixNetwork.Mainnet,
      applicationVersion: '1.0.0',
      applicationName: 'Hello Token dApp',
         applicationDappDefinitionAddress: 'account_rdx168r05zkmtvruvqfm4rfmgnpvhw8a47h6ln7vl3rgmyrlzmfvdlfgcg',
    })

    // Initialize the Gateway API for network queries
    this.innerGatewayApi = GatewayApiClient.initialize(this.innerRDT.gatewayApi.clientConfig)

    // Fetch the user's account address(es) from the wallet
    this.innerRDT?.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))

    // Subscribe to updates to the user's shared wallet data and store it in the walletData store
    const subs = this.innerRDT?.walletApi.walletData$.subscribe((data) => {
      this.walletData = data

      if (!this.walletConnected) {
        this.selectedAccount = ''
      }
    })

    onDestroy(() => {
      subs?.unsubscribe()
    })
  }

  get rdt(): RadixDappToolkit {
    if (!this.innerRDT)
      throw new Error('RDT not initialized')

    return this.innerRDT
  }

  get gatewayApi(): GatewayApiClient {
    if (!this.innerGatewayApi)
      throw new Error('RDT not initialized')

    return this.innerGatewayApi
  }
}

const RDT_KEY = Symbol('RadixToolkitStore')

export function setRadixToolkitStore() {
  return setContext(RDT_KEY, new RadixToolkitStore())
}

export function getRadixToolkitStore() {
  return getContext<ReturnType<typeof setRadixToolkitStore>>(RDT_KEY)
}
