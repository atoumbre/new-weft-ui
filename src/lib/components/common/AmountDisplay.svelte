<script lang="ts">
  import type Decimal from 'decimal.js';
  import { fAmount, fValue } from "$lib/utils";

  type Props = {
    amount: Decimal;
    priceUSD?: Decimal; // per-unit USD price
    usd?: Decimal; // direct USD value (overrides priceUSD if provided)
  };

  let { amount, priceUSD, usd }: Props = $props();

  const usdDec: Decimal | undefined = $derived.by(() => {
    if (usd !== undefined) return usd;
    if (priceUSD !== undefined) return amount.mul(priceUSD);
    return undefined;
  });
</script>

<div class="leading-tight text-right">
  <div class="font-medium tabular-nums">{fAmount(amount)}</div>
  {#if usdDec !== undefined}
    <div class="text-xs opacity-70 tabular-nums">{fValue(usdDec)}</div>
  {/if}
</div>
