<script lang='ts'>
  import type Decimal from 'decimal.js'
  import { dec, fPercent, fValue } from '$lib/utils'

  interface Props {
    symbol: string
    iconUrl: string | undefined
    previousPriceUsd: Decimal
    priceUsd: Decimal
    resourceAddress?: string
  }

  const { symbol, iconUrl, previousPriceUsd, priceUsd, resourceAddress }: Props = $props()

  const change24h = $derived(priceUsd.sub(previousPriceUsd).div(priceUsd).toNumber())
</script>

{#if resourceAddress}
  <a
    href='/resource/{resourceAddress}'
    class='flex items-center gap-3 transition-opacity hover:opacity-80'
  >
    <div class='avatar'>
      <div class='mask h-8 w-8 mask-circle'>
        {#if iconUrl?.startsWith('http')}
          <img src={iconUrl} alt={symbol} />
        {:else}
          <div class='flex items-center justify-center bg-base-300 text-lg'>{iconUrl}</div>
        {/if}
      </div>
    </div>
    <div>
      <div class='font-bold'>{symbol}</div>
      <div class='text-sm opacity-50'>{fValue(priceUsd)}</div>
      <div class="text-xs {change24h >= 0 ? 'text-success' : 'text-error'}">
        {change24h >= 0 ? '+' : ''}{fPercent(dec(change24h))}
      </div>
    </div>
  </a>
{:else}
  <div class='flex items-center gap-3'>
    <div class='avatar'>
      <div class='mask h-8 w-8 mask-circle'>
        {#if iconUrl?.startsWith('http')}
          <img src={iconUrl} alt={symbol} />
        {:else}
          <div class='flex items-center justify-center bg-base-300 text-lg'>{iconUrl}</div>
        {/if}
      </div>
    </div>
    <div>
      <div class='font-bold'>{symbol}</div>
      <div class='text-sm opacity-50'>{fValue(priceUsd)}</div>
      <div class="text-xs {change24h >= 0 ? 'text-success' : 'text-error'}">
        {change24h >= 0 ? '+' : ''}{fPercent(dec(change24h))}
      </div>
    </div>
  </div>
{/if}
