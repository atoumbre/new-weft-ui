<script lang='ts'>
  import type Decimal from 'decimal.js'
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import TokenCell from '$lib/components/common/TokenCell.svelte'
  import LendingForm from '$lib/components/forms/LendingForm.svelte'
  import { dec } from '$lib/utils/common'

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

  type Pool = {
    id: string
    asset: string
    utilization: number
    supplyApr: string
    borrowApr: string
    totalSupply: string
    totalBorrow: string
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

  const availablePools: Pool[] = [
    {
      id: 'pool1',
      asset: 'USDT',
      utilization: 75,
      supplyApr: '4.12',
      borrowApr: '6.85',
      totalSupply: '2.5M',
      totalBorrow: '1.8M',
      logo: '💵',
    },
    {
      id: 'pool2',
      asset: 'DAI',
      utilization: 68,
      supplyApr: '3.95',
      borrowApr: '6.22',
      totalSupply: '1.8M',
      totalBorrow: '1.2M',
      logo: '🪙',
    },
    {
      id: 'pool3',
      asset: 'LINK',
      utilization: 82,
      supplyApr: '5.25',
      borrowApr: '8.15',
      totalSupply: '850K',
      totalBorrow: '697K',
      logo: '🔗',
    },
    {
      id: 'pool4',
      asset: 'MATIC',
      utilization: 45,
      supplyApr: '6.75',
      borrowApr: '9.25',
      totalSupply: '3.2M',
      totalBorrow: '1.4M',
      logo: '🔷',
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

  let formOpen = $state(false)
  let presetType = $state<'supply' | 'withdraw' | undefined>(undefined)
  let presetAsset = $state<string | undefined>(undefined)

  function openForm(type?: 'supply' | 'withdraw', asset?: string) {
    presetType = type
    presetAsset = asset
    formOpen = true
  }

  function handleSubmit(_e: CustomEvent<{ actions: any[] }>) {
    formOpen = false
  }
</script>

<svelte:head>
  <title>Lending - Weft</title>
</svelte:head>

<div class='container mx-auto space-y-8 px-4 py-8'>
  <div>
    <h1 class='mb-2 text-3xl font-bold'>Lending</h1>
    <p class='text-base-content/70'>
      Supply assets to earn yield and manage your lending positions
    </p>
  </div>

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

    <!-- Available Lending Pools -->
    <div class='card bg-base-200/60'>
      <div class='card-body'>
        <div class='flex items-center justify-between'>
          <h2 class='card-title'>Available Lending Pools</h2>
        </div>

        <div class='mt-4 overflow-x-auto'>
          <table class='table'>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Supply APR</th>
                <th>Utilization</th>
                <th>Total Supply</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each availablePools as pool}
                <tr class='hover'>
                  <td>
                    <div class='flex items-center gap-3'>
                      <div class='text-2xl'>{pool.logo}</div>
                      <div>
                        <div class='font-bold'>{pool.asset}</div>
                        <div class='text-sm opacity-50'>Pool {pool.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class='font-medium text-success'>{pool.supplyApr}%</span>
                  </td>
                  <td>
                    <div class='flex items-center gap-2'>
                      <progress
                        class='progress w-20 progress-primary'
                        value={pool.utilization}
                        max='100'
                      ></progress>
                      <span class='text-sm'>{pool.utilization}%</span>
                    </div>
                  </td>
                  <td>{pool.totalSupply}</td>
                  <td>
                    <button
                      class='btn btn-sm btn-primary'
                      onclick={() => openForm('supply', pool.asset)}
                    >
                      Supply
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Lending form modal -->
  <LendingForm bind:open={formOpen} {presetType} {presetAsset} on:submit={handleSubmit} />
</div>
