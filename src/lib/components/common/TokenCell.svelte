<script lang='ts'>
  import PriceChange from './PriceChange.svelte'

  type Props = {
    logo?: string
    symbol?: string
    price?: string
    change?: string | number
    iconUrl?: string
  }
  const { logo = '', symbol = '', price, change, iconUrl }: Props = $props()

  const hasIconUrl = $derived(Boolean(iconUrl && /^https?:|data:/.test(iconUrl)))
</script>

<div class='flex items-center gap-4'>
  {#if hasIconUrl}
    <div class='avatar'>
      <div class='h-8 w-8 rounded-full ring ring-base-100 ring-offset-1'>
        <img
          src={iconUrl}
          alt={`${symbol ?? 'Token'} icon`}
          class='h-full w-full rounded-full object-cover'
          loading='lazy'
        />
      </div>
    </div>
  {:else if logo}
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
