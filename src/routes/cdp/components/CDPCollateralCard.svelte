<script lang='ts'>
  import type { CollateralPositionData } from '$lib/internal_modules/weft-ledger-state'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fPercent } from '$lib/utils/common'

  type CollateralPositionMetadata = {
    symbol: string
    iconUrl: string | undefined
    priceUsd: Decimal
    previousPriceUsd: Decimal
  }

  const {
    resourceAddress,
    positionData,
    onAddCollateral,
    onRemoveCollateral,
  }: { resourceAddress: string, positionData: CollateralPositionData, onAddCollateral: (symbol?: string) => void, onRemoveCollateral: (symbol?: string) => void } = $props()

  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()
  const metadataService = getMetadataService()

  function getPositionMetadata(): CollateralPositionMetadata {
    const { current: priceInXRD, previous: previousPriceInXRD } = priceStore.getPrice(
      resourceAddress,
    )
    const priceInUSD = xrdPriceStore.xrdPrice.mul(priceInXRD)
    const previousPriceInUSD = xrdPriceStore.xrdPreviousPrice.mul(previousPriceInXRD)

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
    }
  }

  const positionMetadata = $derived(getPositionMetadata())
</script>

<div
  class='group flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100/5 p-4 transition-colors hover:border-base-300 hover:bg-base-100/10 sm:p-5'
>
  <div class='flex items-center gap-4'>
    <AssetCard
      iconUrl={positionMetadata?.iconUrl}
      symbol={positionMetadata?.symbol}
      priceUsd={positionMetadata?.priceUsd ?? dec(0)}
      previousPriceUsd={positionMetadata?.previousPriceUsd ?? dec(0)}
    />
  </div>
  <div class='flex items-center gap-6'>
    <div class='flex flex-wrap items-center justify-end gap-4 sm:gap-6'>
      <AmountDisplay
        amount={positionData.amount}
        priceUSD={positionMetadata.priceUsd}
      />
      <div class='text-right'>
        <div class='text-sm opacity-70'>Max LTV</div>
        <div class='font-medium text-info'>
          {fPercent(positionData.config.loanToValueRatio)}
        </div>
      </div>
      <div class='flex gap-2'>
        <button
          class='btn btn-outline btn-sm'
          onclick={() => onAddCollateral(positionMetadata?.symbol)}
        >
          Add
        </button>
        <button
          class='btn btn-outline btn-sm'
          onclick={() => onRemoveCollateral(positionMetadata?.symbol)}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</div>
