<script lang="ts">
  type Props = {
    amount?: number | string;
    symbol?: string;
    priceUSD?: number; // per-unit USD price
    usd?: number; // direct USD value (overrides priceUSD if provided)
  };
  let { amount = 0, symbol = '', priceUSD, usd }: Props = $props();

  function toNumber(x: number | string): number {
    if (typeof x === 'number') return x;
    const cleaned = x.replace(/[$,\s]/g, '');
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  const amountNum = $derived(toNumber(amount));
  const usdValue = $derived(
    usd !== undefined ? usd : priceUSD !== undefined ? amountNum * priceUSD : undefined
  );

  function fmtAmount(n: number): string {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 20
    });
  }

  function fmtUsd(n: number): string {
    return n.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
</script>

<div class="leading-tight text-right">
  <div class="font-medium">{fmtAmount(amountNum)}</div>
  {#if usdValue !== undefined}
    <div class="text-xs opacity-70">{fmtUsd(usdValue)}</div>
  {/if}
</div>

