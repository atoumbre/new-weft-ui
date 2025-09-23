<script lang='ts'>
  import type { CollateralPositionData, NFTCollateralPositionData } from '$lib/internal_modules/dist'
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import TokenCell from '$lib/components/common/TokenCell.svelte'
  import { fPercent, fValue } from '$lib/utils/common'

  type ResourceMeta = {
    symbol: string
    name: string
    logo: string
    iconUrl?: string
    priceUsd: Decimal
    previousPriceUsd: Decimal
    changePct: Decimal | null
    collateralLtv?: Decimal
    borrowingApr?: Decimal
  }

  let {
    collateralTab = $bindable('fungible' as 'fungible' | 'nft'),
    currentCollateralList,
    nftCollateralList,
    resourceMeta,
    convertToUsd,
    shortenAddress,
    formatCdpId,
    onAddCollateral,
    onRemoveCollateral,
  } = $props<{
    collateralTab: 'fungible' | 'nft'
    currentCollateralList: Array<{ address: string, collateral: CollateralPositionData }>
    nftCollateralList: Array<[string, NFTCollateralPositionData]>
    resourceMeta: Map<string, ResourceMeta>
    convertToUsd: (value?: Decimal | null) => Decimal
    shortenAddress: (address: string, prefix?: number, suffix?: number) => string
    formatCdpId: (id: string) => string
    onAddCollateral: (symbol?: string) => void
    onRemoveCollateral: (symbol?: string) => void
  }>()
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
            {@const meta = resourceMeta.get(address)}
            <ListRow>
              {#snippet left()}
                <TokenCell
                  logo={meta?.logo}
                  iconUrl={meta?.iconUrl}
                  symbol={meta?.symbol ?? shortenAddress(address)}
                  price={meta ? fValue(meta.priceUsd) : undefined}
                  change={meta?.changePct ? meta.changePct.toFixed(2) : undefined}
                />
              {/snippet}
              {#snippet right()}
                <div class='flex flex-wrap items-center justify-end gap-4 sm:gap-6'>
                  <AmountDisplay
                    amount={collateral.amount}
                    usd={convertToUsd(collateral.value)}
                  />
                  <div class='text-right'>
                    <div class='text-sm opacity-70'>Max LTV</div>
                    <div class='font-medium text-info'>
                      {meta?.collateralLtv ? fPercent(meta.collateralLtv) : '—'}
                    </div>
                  </div>
                  <div class='flex gap-2'>
                    <button
                      class='btn btn-outline btn-sm'
                      onclick={() => onAddCollateral(meta?.symbol)}
                    >
                      Add
                    </button>
                    <button
                      class='btn btn-outline btn-sm'
                      onclick={() => onRemoveCollateral(meta?.symbol)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              {/snippet}
            </ListRow>
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
                {#each Object.entries(nft.underlyingPositions || {}) as [resourceAddress, collateral]}
                  {@const meta = resourceMeta.get(resourceAddress)}
                  <ListRow>
                    {#snippet left()}
                      <TokenCell
                        logo={meta?.logo}
                        iconUrl={meta?.iconUrl}
                        symbol={meta?.symbol ?? shortenAddress(resourceAddress)}
                        price={meta ? fValue(meta.priceUsd) : undefined}
                        change={meta?.changePct ? meta.changePct.toFixed(2) : undefined}
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
