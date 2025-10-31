<script lang='ts'>
  import type { CollateralPositionData, NFTCollateralPositionData } from '$lib/internal_modules/weft-ledger-state'

  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import AssetCard from '$lib/components/common/AssetCard.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { dec } from '$lib/utils/common'
  import CDPCollateralCard from './CDPCollateralCard.svelte'

  // type ResourceMeta = {
  //   symbol: string
  //   name: string
  //   logo: string
  //   iconUrl?: string
  //   priceUsd: Decimal
  //   previousPriceUsd: Decimal
  //   collateralLtv?: Decimal
  //   borrowingApr?: Decimal
  // }

  const metadataService = getMetadataService()
  const priceStore = getPriceStore()

  let {
    collateralTab = $bindable('fungible' as 'fungible' | 'nft'),
    currentCollateralList,
    nftCollateralList,
    // resourceMeta,
    convertToUsd,
    shortenAddress,
    formatCdpId,
    onAddCollateral,
    onRemoveCollateral,
  }: {
    collateralTab: 'fungible' | 'nft'
    currentCollateralList: Array<{ address: string, collateral: CollateralPositionData }>
    nftCollateralList: Array<[string, NFTCollateralPositionData]>
    // resourceMeta: Map<string, ResourceMeta>
    convertToUsd: (value?: Decimal | null) => Decimal
    shortenAddress: (address: string, prefix?: number, suffix?: number) => string
    formatCdpId: (id: string) => string
    onAddCollateral: (symbol?: string) => void
    onRemoveCollateral: (symbol?: string) => void
  } = $props()

</script>

<div class='card bg-base-200/60'>
  <div class='card-body'>
    <div class='flex items-center justify-between mb-4'>
      <h3 class='card-title'>Collateral Positions</h3>
      <button class='btn btn-primary btn-sm' onclick={() => onAddCollateral()}>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' class='h-4 w-4'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
        </svg>
        Add Collateral
      </button>
    </div>

    <Tabs>
      <Tab id='fungible' bind:activeId={collateralTab} label='Fungible' />
      <Tab id='nft' bind:activeId={collateralTab} label='NFT Wrappers' />
    </Tabs>

    {#if collateralTab === 'fungible'}
      {#if currentCollateralList.length}
        <div class='space-y-3'>
          {#each currentCollateralList as { address, collateral }}

            <CDPCollateralCard resourceAddress={address} positionData={collateral} {onAddCollateral} {onRemoveCollateral}></CDPCollateralCard>
          {/each}
        </div>
      {:else}
        <div class='rounded-lg bg-base-100 p-8 text-center'>
          <div class='text-base-content/60'>No fungible collateral yet</div>
          <div class='mt-2 text-sm text-base-content/40'>Add collateral to secure your loans</div>
        </div>
      {/if}
    {:else}
      {#if nftCollateralList.length}
        <div class='space-y-3'>
          {#each nftCollateralList as [wrapperId, nft]}
            <div class='rounded border border-base-300 bg-base-100/60 p-3'>
              <div class='font-mono text-sm text-primary'>Wrapper: {formatCdpId(wrapperId)}</div>
              <div class='mt-2 space-y-2'>
                {#each Object.entries(nft.underlyingPositions || {}) as [address, collateral]}
                  {@const meta = metadataService.getResourceFromCache(address)}
                  {@const price = priceStore.buildPrice(address)}
                  <ListRow>
                    {#snippet left()}
                      <AssetCard
                        iconUrl={meta?.metadata.iconUrl}
                        symbol={meta?.metadata.symbol ?? shortenAddress(address)}
                        priceUsd={price?.priceUsd ?? dec(0)}
                        previousPriceUsd={price?.previousPriceUsd ?? dec(0)}
                      />
                    {/snippet}
                    {#snippet right()}
                      <AmountDisplay
                        amount={(collateral as any).amount}
                        usd={convertToUsd((collateral as any).value)}
                      />
                    {/snippet}
                  </ListRow>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class='rounded-lg bg-base-100 p-8 text-center'>
          <div class='text-base-content/60'>No NFT collateral wrappers found</div>
          <div class='mt-2 text-sm text-base-content/40'>NFT wrappers will appear here when available</div>
        </div>
      {/if}
    {/if}
  </div>
</div>
