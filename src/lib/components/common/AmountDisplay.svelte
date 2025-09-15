<script lang="ts">
  import { dec, fAmount, fValue } from "$lib/utils";

  type Props = {
    amount?: number | string;
    symbol?: string;
    priceUSD?: number; // per-unit USD price
    usd?: number; // direct USD value (overrides priceUSD if provided)
  };
  let { amount = 0, symbol = '', priceUSD, usd }: Props = $props();

  function toNumber(x: number | string): number {
   return dec(x).toNumber()
  }

  const amountNum = $derived.by(()=>{
    return toNumber(amount)
  });

  const usdValue = $derived(
    usd !== undefined ? usd : priceUSD !== undefined ? amountNum * priceUSD : undefined
  );

</script>

<div class="leading-tight text-right">
  <div class="font-medium tabular-nums">{fAmount(dec(amountNum))}</div>
  {#if usdValue !== undefined}
    <div class="text-xs opacity-70 tabular-nums">{fValue(dec(usdValue))}</div>
  {/if}
</div>
