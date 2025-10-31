<script lang='ts'>
  import type { LSUResource } from '$lib/internal_modules/weft-ledger-state'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getMarketResourceStore } from '$lib/stores/market-resource.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'

  type LSUData = {
    id: string
    // asset: string
    validatorName: string
    amount: Decimal
    amountUsd: Decimal
    unitRedemptionValue: Decimal
    logo: string | undefined
  }

  const marketInfoStore = getMarketInfoStore()
  const xrdPriceStore = getXRDPriceStore()
  const marketResource = getMarketResourceStore()

  function transformLSUData(lsuData: LSUResource): LSUData {
    const unitRedemptionValue = lsuData.unitRedemptionValue
    const priceInUSD = unitRedemptionValue.mul(xrdPriceStore.xrdPrice)
    const iconUrl = lsuData.validatorMetadata?.iconUrl

    const validatorName = lsuData.validatorMetadata.name ?? lsuData.metadata.name

    return {
      id: lsuData.resourceAddress,
      // asset: symbol,
      validatorName,
      amount: lsuData.amount,
      amountUsd: lsuData.amount.mul(priceInUSD),
      unitRedemptionValue,
      logo: iconUrl,
    }
  }

  // Get LSU data sorted by amount USD value descending
  const lsuData: LSUData[] = $derived.by(() => {
    return marketResource.getLSUCollaterals()
      .map(lsuAmount => transformLSUData(lsuAmount))
      .sort((a, b) => b.amountUsd.cmp(a.amountUsd))
  })
</script>

<div class='card-body'>
  <div class='flex items-center justify-between'>
    <h2 class='card-title'>LSU Collaterals</h2>
  </div>
  <div class='mt-2 overflow-x-auto'>
    <table class='table table-sm'>
      <thead class='sticky top-0 bg-base-300/30 backdrop-blur'>
        <tr>
          <th>Asset</th>
          <th><div class='tooltip' data-tip='XRD value per LSU token'>Unit Redemption Value</div></th>
          <th>Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if marketInfoStore.loading}
          <tr>
            <td colspan='4' class='py-8 text-center'>
              <span class='loading loading-md loading-spinner'></span>
              <span class='ml-2 opacity-70'>Loading LSU data...</span>
            </td>
          </tr>
        {:else if lsuData.length === 0}
          <tr>
            <td colspan='4' class='py-8 text-center opacity-70'>No LSU data available</td>
          </tr>
        {:else}
          {#each lsuData as lsu}
            <tr>
              <td>
                <div class='flex items-center gap-4'>
                  <div class='avatar'>
                    <div class='mask h-8 w-8 mask-circle'>
                      {#if lsu.logo?.startsWith('http')}
                        <img src={lsu.logo} alt={lsu.validatorName} />
                      {:else}
                        <div class='flex items-center justify-center bg-base-300 text-lg'>{lsu.logo}</div>
                      {/if}
                    </div>
                  </div>
                  <div>
                    <div class='font-bold'>{lsu.validatorName}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class='font-medium'>{lsu.unitRedemptionValue.toFixed(6)} XRD</span>
              </td>
              <td class='text-sm'>
                <AmountDisplay amount={lsu.amount} usd={lsu.amountUsd} />
              </td>
              <td>
                <div class='flex gap-2'>
                  <button class='btn btn-outline btn-sm'>Supply</button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
