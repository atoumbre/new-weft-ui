<script lang='ts'>
  import type { LoanPositionData } from '$lib/internal_modules/weft-ledger-state'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fPercent } from '$lib/utils/common'

  interface TransformedLoanPositionData {
    symbol: string
    iconUrl: string
    priceUsd: Decimal
    previousPriceUsd: Decimal
    amount: Decimal
    borrowingApr: Decimal
  }

  const {
    resourceAddress,
    loanPosition,
    onBorrow,
    onRepay,
  }: { resourceAddress: string, loanPosition: LoanPositionData, onBorrow: (symbol?: string) => void, onRepay: (symbol?: string) => void } = $props()

  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()
  const metadataService = getMetadataService()

  function transformLoanPositionData(): TransformedLoanPositionData {
    const { current: priceInXRD, previous: previousPriceInXRD } = priceStore.getPrice(
      resourceAddress,
    )
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
    const previousPriceInUSD = xrdPriceStore.xrdPreviousPrice.mul(previousPriceInXRD)

    const marketInfo = marketInfoStore.loanResources.find(l => l.resourceAddress === resourceAddress)
    const metadata = metadataService.resourceInfoState.get(resourceAddress)?.metadata

    const symbol
      = metadata?.symbol
        || metadata?.name
        || resourceAddress.slice(-4)

    const iconUrl = metadata?.iconUrl

    return {
      symbol,
      iconUrl,
      priceUsd: priceInUSD,
      previousPriceUsd: previousPriceInUSD,
      amount: loanPosition.amount,
      borrowingApr: marketInfo?.lendingPoolState?.borrowingApr ?? dec(0),
    }
  }

  const transformedLoanPosition = $derived(transformLoanPositionData())

</script>

<div
  class='group flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100/5 p-4 transition-colors hover:border-base-300 hover:bg-base-100/10 sm:p-5'
>
  <div class='flex items-center gap-4'>
    <AssetCard
      iconUrl={transformedLoanPosition?.iconUrl}
      symbol={transformedLoanPosition?.symbol}
      priceUsd={transformedLoanPosition?.priceUsd ?? dec(0)}
      previousPriceUsd={transformedLoanPosition?.previousPriceUsd ?? dec(0)}
    />
  </div>
  <div class='flex items-center gap-6'>
    <div class='flex flex-wrap items-center gap-4 sm:gap-6'>
      <AmountDisplay amount={transformedLoanPosition.amount} priceUSD={transformedLoanPosition?.priceUsd} />
      <div class='text-right'>
        <div class='text-sm opacity-70'>APR</div>
        <div class='font-medium text-warning'>
          {transformedLoanPosition?.borrowingApr ? fPercent(transformedLoanPosition.borrowingApr) : '—'}
        </div>
      </div>
      <div class='flex gap-2'>
        <button
          class='btn btn-outline btn-sm'
          onclick={() => onRepay(transformedLoanPosition?.symbol)}
        >
          Repay
        </button>
        <button
          class='btn btn-outline btn-sm'
          onclick={() => onBorrow(transformedLoanPosition?.symbol)}
        >
          Borrow
        </button>
      </div>
    </div>
  </div>
</div>
