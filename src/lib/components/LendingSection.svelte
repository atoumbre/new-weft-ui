<script lang='ts'>
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import TokenCell from '$lib/components/common/TokenCell.svelte'
  import LendingForm from '$lib/components/forms/LendingForm.svelte'
  import { dec } from '$lib/utils'

  type LendingPosition = {
    id: string
    asset: string
    supplied: string
    apr: string
    earned: string
    price: string
    change24h: string | number
    isPositive: boolean
    logo: string
  }

  const lendingPositions: LendingPosition[] = [
    {
      id: 'pos1',
      asset: 'USDC',
      supplied: '12,500.00',
      apr: '4.25',
      earned: '125.50',
      price: '$1.00',
      change24h: '+0.02',
      isPositive: true,
      logo: '💰',
    },
    {
      id: 'pos2',
      asset: 'ETH',
      supplied: '2.5',
      apr: '3.85',
      earned: '0.045',
      price: '$2,485.67',
      change24h: '+3.24',
      isPositive: true,
      logo: '⟠',
    },
    {
      id: 'pos3',
      asset: 'WBTC',
      supplied: '0.25',
      apr: '2.95',
      earned: '0.012',
      price: '$67,234.12',
      change24h: '-1.85',
      isPositive: false,
      logo: '₿',
    },
  ]

  function parseUsdDec(s: string): Decimal {
    const cleaned = s.replace(/[$,\s]/g, '')
    return dec(cleaned || '0')
  }
  function parseUnitsDec(s: string): Decimal {
    const cleaned = s.replace(/[,\s]/g, '')
    return dec(cleaned || '0')
  }

  // Popup form controls
  let formOpen = $state(false)
  let presetType = $state<'supply' | 'withdraw' | undefined>(undefined)
  let presetAsset = $state<string | undefined>(undefined)
  function openForm(type?: 'supply' | 'withdraw', asset?: string) {
    presetType = type
    presetAsset = asset
    formOpen = true
  }
  function handleSubmit(_e: CustomEvent<{ actions: any[] }>) {
    // TODO: Wire to contracts. For now, just close.
    formOpen = false
  }
</script>

<div class='space-y-6'>
  <!-- Your Lending Positions -->
  <div class='card bg-base-200/60'>
    <div class='card-body'>
      <div class='flex items-center justify-between'>
        <h2 class='card-title'>Your Lending Positions</h2>
        <button class='btn btn-outline btn-sm' onclick={() => openForm()}>Add</button>
      </div>

      <div class='mt-4 space-y-3'>
        {#each lendingPositions as position}
          <ListRow>
            {#snippet left()}
              <TokenCell
                logo={position.logo}
                symbol={position.asset}
                price={position.price}
                change={position.change24h}
              />
            {/snippet}
            {#snippet right()}
              <div class='flex items-center gap-6'>
                <div class='text-right'>
                  <AmountDisplay
                    amount={parseUnitsDec(position.supplied)}
                    usd={parseUsdDec(position.price).mul(parseUnitsDec(position.supplied))}
                  />
                </div>
                <div class='text-right'>
                  <div class='text-sm opacity-70'>APR</div>
                  <div class='font-medium text-success'>{position.apr}%</div>
                </div>

                <div class='flex gap-2'>
                  <button
                    class='btn btn-outline btn-sm'
                    onclick={() => openForm('supply', position.asset)}>Supply</button
                  >
                  <button
                    class='btn btn-outline btn-sm'
                    onclick={() => openForm('withdraw', position.asset)}>Withdraw</button
                  >
                </div>
              </div>
            {/snippet}
          </ListRow>
        {/each}
      </div>
    </div>
  </div>

  <!-- Lending form modal -->
  <LendingForm bind:open={formOpen} {presetType} {presetAsset} on:submit={handleSubmit} />
</div>
