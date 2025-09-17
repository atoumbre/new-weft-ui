<script lang='ts'>
  import { dec, fPercent, fValue } from '$lib/utils';
  import type Decimal from 'decimal.js';

  interface Props {
    symbol: string;
    iconUrl: string | undefined;
    previousPriceUsd: Decimal;
    priceUsd: Decimal;
    resourceAddress?: string;
  }

  const { symbol, iconUrl, previousPriceUsd, priceUsd, resourceAddress }: Props = $props()

  const change24h = $derived(priceUsd.sub(previousPriceUsd).div(priceUsd).toNumber())
</script>

{#if resourceAddress}
  <a href="/resource/{resourceAddress}" class='flex items-center gap-3 hover:opacity-80 transition-opacity'>
    <div class='avatar'>
        <div class='mask mask-circle w-8 h-8'>
        {#if iconUrl?.startsWith('http')}
            <img src={iconUrl} alt={symbol} />
        {:else}
            <div class='bg-base-300 flex items-center justify-center text-lg'>{iconUrl}</div>
        {/if}
        </div>
    </div>
    <div>
        <div class='font-bold'>{symbol}</div>
        <div class='text-sm opacity-50'>{fValue(priceUsd)}</div>
        <div class="text-xs {change24h >= 0 ? 'text-success' : 'text-error'}">{change24h >= 0 ? '+' : ''}{fPercent(dec(change24h))}</div>
    </div>
  </a>
{:else}
  <div class='flex items-center gap-3'>
    <div class='avatar'>
        <div class='mask mask-circle w-8 h-8'>
        {#if iconUrl?.startsWith('http')}
            <img src={iconUrl} alt={symbol} />
        {:else}
            <div class='bg-base-300 flex items-center justify-center text-lg'>{iconUrl}</div>
        {/if}
        </div>
    </div>
    <div>
        <div class='font-bold'>{symbol}</div>
        <div class='text-sm opacity-50'>{fValue(priceUsd)}</div>
        <div class="text-xs {change24h >= 0 ? 'text-success' : 'text-error'}">{change24h >= 0 ? '+' : ''}{fPercent(dec(change24h))}</div>
    </div>
  </div>
{/if}

