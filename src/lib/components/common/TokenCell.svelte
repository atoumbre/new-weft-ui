<script lang='ts'>
  import PriceChange from './PriceChange.svelte'

  type Props = {
    logo?: string
    symbol?: string
    price?: string
    change?: string | number
    isPositive?: boolean
  }
  const { logo = '', symbol = '', price, change, isPositive = true }: Props = $props()
</script>

<div class='flex items-center gap-4'>
  {#if logo}
    <div class='avatar placeholder'>
      <div class='w-8 h-8 rounded-full bg-base-200 ring ring-base-100 ring-offset-1 text-base flex items-center justify-center'>
        {logo}
      </div>
    </div>
  {/if}
  <div>
    <div class='font-medium'>{symbol}</div>
    {#if price}
      <div class='text-sm opacity-70 flex items-center gap-2'>
        <span>{price}</span>
        {#if change !== undefined}
          <PriceChange value={change} {isPositive} />
        {/if}
      </div>
    {/if}
  </div>
</div>
