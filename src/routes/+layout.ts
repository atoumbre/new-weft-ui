import { WeftLedgerSateFetcher } from '$lib/internal_modules/dist'
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'

export const ssr = false
export const prerender = true

// Initialize stores immediately
const gatewayApiClient = GatewayApiClient.initialize({
  basePath: 'https://mainnet.radixdlt.com',
  applicationName: 'Weft API',
  headers: {
    'User-Agent': 'WeftFinance',
  },
})

WeftLedgerSateFetcher.setInstance(gatewayApiClient)
