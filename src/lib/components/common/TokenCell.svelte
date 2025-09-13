<script lang="ts">
  import PriceChange from './PriceChange.svelte';
  type Props = {
    logo?: string;
    symbol?: string;
    price?: string;
    change?: string | number;
    isPositive?: boolean;
  };
  let { logo = '', symbol = '', price, change, isPositive = true }: Props = $props();
</script>

<div class="flex items-center gap-4">
  {#if logo}
    <span class="text-2xl">{logo}</span>
  {/if}
  <div>
    <div class="font-medium">{symbol}</div>
    {#if price}
      <div class="text-sm opacity-70 flex items-center gap-2">
        <span>{price}</span>
        {#if change !== undefined}
          <PriceChange value={change} {isPositive} />
        {/if}
      </div>
    {/if}
  </div>
</div>
