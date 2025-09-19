<script lang='ts'>
  import PriceChange from './PriceChange.svelte'

  type Props = {
    logo?: string
    symbol?: string
    price?: string
    change?: string | number
  }
  const { logo = '', symbol = '', price, change }: Props = $props()
</script>

<div class='flex items-center gap-4'>
  {#if logo}
    <div class='placeholder avatar'>
      <div
        class='flex h-8 w-8 items-center justify-center rounded-full bg-base-200 text-base ring ring-base-100 ring-offset-1'
      >
        {logo}
      </div>
    </div>
  {/if}
  <div>
    <div class='font-medium'>{symbol}</div>
    {#if price}
      <div class='flex items-center gap-2 text-sm opacity-70'>
        <span>{price}</span>
        {#if change !== undefined}
          <PriceChange value={change} />
        {/if}
      </div>
    {/if}
  </div>
</div>
