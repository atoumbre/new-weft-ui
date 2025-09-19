<script lang='ts'>
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte'
  import HealthPill from '$lib/components/common/HealthPill.svelte'
  import ListRow from '$lib/components/common/ListRow.svelte'
  import Tab from '$lib/components/common/Tab.svelte'
  import Tabs from '$lib/components/common/Tabs.svelte'
  import TokenCell from '$lib/components/common/TokenCell.svelte'
  import CDPForm from '$lib/components/forms/CDPForm.svelte'
  import { dec } from '$lib/utils'

  type Collateral = {
    asset: string
    amount: string
    value: string
    price: string
    change24h: string | number
    isPositive: boolean
    logo: string
    ltv?: string
  }

  type Loan = {
    asset: string
    borrowed: string
    interestRate: string
    price: string
    change24h: string | number
    isPositive: boolean
    logo: string
  }

  type CDP = {
    id: string
    collaterals: Collateral[]
    loans: Loan[]
    healthRatio: number
    totalCollateral: string
    totalDebt: string
    liquidationPrice: string
    status: 'healthy' | 'warning' | 'error' | string
  }

  type AvailableCollateral = {
    id: string
    asset: string
    price: string
    change24h: string | number
    isPositive: boolean
    ltv: string
    totalSupplied: string
    logo: string
  }

  type LoanResource = {
    id: string
    asset: string
    price: string
    change24h: string | number
    isPositive: boolean
    borrowApr: string
    availableLiquidity: string
    logo: string
  }

  const cdpPositions: CDP[] = [
    {
      id: 'CDP-001',
      collaterals: [
        {
          asset: 'ETH',
          amount: '5.0',
          value: '$12,500',
          price: '$2,485.67',
          change24h: '+3.24',
          isPositive: true,
          logo: '⟠',
          ltv: '75%',
        },
        {
          asset: 'WBTC',
          amount: '0.15',
          value: '$6,750',
          price: '$67,234.12',
          change24h: '-1.85',
          isPositive: false,
          logo: '₿',
          ltv: '70%',
        },
      ],
      loans: [
        {
          asset: 'USDC',
          borrowed: '8,500',
          interestRate: '5.25',
          price: '$1.00',
          change24h: '+0.02',
          isPositive: true,
          logo: '💰',
        },
        {
          asset: 'DAI',
          borrowed: '2,000',
          interestRate: '4.85',
          price: '$0.998',
          change24h: '-0.12',
          isPositive: false,
          logo: '🪙',
        },
      ],
      healthRatio: 2.1,
      totalCollateral: '$19,250',
      totalDebt: '$10,500',
      liquidationPrice: '$1,890',
      status: 'healthy',
    },
    {
      id: 'CDP-002',
      collaterals: [
        {
          asset: 'LINK',
          amount: '1,200',
          value: '$18,000',
          price: '$15.00',
          change24h: '+2.15',
          isPositive: true,
          logo: '🔗',
          ltv: '65%',
        },
      ],
      loans: [
        {
          asset: 'USDT',
          borrowed: '12,000',
          interestRate: '6.15',
          price: '$1.001',
          change24h: '+0.08',
          isPositive: true,
          logo: '💵',
        },
        {
          asset: 'USDTW',
          borrowed: '12,000',
          interestRate: '6.15',
          price: '$1.001',
          change24h: '+0.08',
          isPositive: true,
          logo: '💵',
        },
      ],
      healthRatio: 1.45,
      totalCollateral: '$18,000',
      totalDebt: '$12,000',
      liquidationPrice: '$12.50',
      status: 'warning',
    },
    {
      id: 'CDP-003',
      collaterals: [
        {
          asset: 'MATIC',
          amount: '15,000',
          value: '$13,500',
          price: '$0.90',
          change24h: '-4.25',
          isPositive: false,
          logo: '🔷',
          ltv: '60%',
        },
      ],
      loans: [
        {
          asset: 'DAI',
          borrowed: '7,200',
          interestRate: '4.95',
          price: '$0.998',
          change24h: '-0.12',
          isPositive: false,
          logo: '🪙',
        },
      ],
      healthRatio: 1.85,
      totalCollateral: '$13,500',
      totalDebt: '$7,200',
      liquidationPrice: '$0.65',
      status: 'healthy',
    },
  ]

  const availableCollaterals: AvailableCollateral[] = [
    {
      id: 'col1',
      asset: 'ETH',
      price: '$2,485.67',
      change24h: '+3.24',
      isPositive: true,
      ltv: '75%',
      totalSupplied: '$45.2M',
      logo: '⟠',
    },
    {
      id: 'col2',
      asset: 'WBTC',
      price: '$67,234.12',
      change24h: '-1.85',
      isPositive: false,
      ltv: '70%',
      totalSupplied: '$28.7M',
      logo: '₿',
    },
    {
      id: 'col3',
      asset: 'LINK',
      price: '$15.00',
      change24h: '+2.15',
      isPositive: true,
      ltv: '65%',
      totalSupplied: '$12.3M',
      logo: '🔗',
    },
    {
      id: 'col4',
      asset: 'MATIC',
      price: '$0.90',
      change24h: '-4.25',
      isPositive: false,
      ltv: '60%',
      totalSupplied: '$8.9M',
      logo: '🔷',
    },
  ]

  const availableLoanResources: LoanResource[] = [
    {
      id: 'loan1',
      asset: 'USDC',
      price: '$1.00',
      change24h: '+0.02',
      isPositive: true,
      borrowApr: '5.25%',
      availableLiquidity: '$2.5M',
      logo: '💰',
    },
    {
      id: 'loan2',
      asset: 'USDT',
      price: '$1.001',
      change24h: '+0.08',
      isPositive: true,
      borrowApr: '6.15%',
      availableLiquidity: '$1.8M',
      logo: '💵',
    },
    {
      id: 'loan3',
      asset: 'DAI',
      price: '$0.998',
      change24h: '-0.12',
      isPositive: false,
      borrowApr: '4.85%',
      availableLiquidity: '$2.2M',
      logo: '🪙',
    },
    {
      id: 'loan4',
      asset: 'FRAX',
      price: '$1.002',
      change24h: '+0.15',
      isPositive: true,
      borrowApr: '4.95%',
      availableLiquidity: '$1.1M',
      logo: '🏛️',
    },
  ]

  let selectedCDP = $state<string>('CDP-001')
  const currentCDP = $derived.by(() => {
    const found = cdpPositions.find(c => c.id === selectedCDP)
    return found
  })

  // Collateral sub-tabs state
  let collatTab = $state<'normal' | 'ftw' | 'nftw'>('normal')

  // Example fungible wrapper positions (multi-underlying baskets)
  type FtWrapperPos = {
    id: string
    wrapper: string // wrapper token symbol/name
    shares: number
    usd: number // total valuation in USD
    underlyings: { logo: string, symbol: string }[]
  }

  const ftWrappersByCdp: Record<string, FtWrapperPos[]> = {
    'CDP-001': [
      {
        id: 'ftw-1',
        wrapper: 'lpUSDC-DAI',
        shares: 1250.23456789,
        usd: 1250.23,
        underlyings: [
          { logo: '💰', symbol: 'USDC' },
          { logo: '🪙', symbol: 'DAI' },
        ],
      },
    ],
    'CDP-002': [
      {
        id: 'ftw-2',
        wrapper: 'stETH',
        shares: 2.3456789,
        usd: 5825.67,
        underlyings: [{ logo: '⟠', symbol: 'ETH' }],
      },
    ],
    'CDP-003': [],
  }
  const ftWrappers = $derived(ftWrappersByCdp[selectedCDP] ?? [])

  // Example NFT wrapper positions
  type NftWrapperPos = {
    id: string
    collection: string
    count: number // number of NFT ids in wrapper lot
    usd: number // total valuation in USD
    icons: string[] // small previews
  }

  const nftWrappersByCdp: Record<string, NftWrapperPos[]> = {
    'CDP-001': [
      {
        id: 'nftw-1',
        collection: 'BlueChip Apes',
        count: 3,
        usd: 128_500,
        icons: ['🦍', '🦍', '🦍', '🦍'],
      },
    ],
    'CDP-002': [
      {
        id: 'nftw-2',
        collection: 'Art Blocks',
        count: 5,
        usd: 54_200,
        icons: ['🎨', '🧩', '🖼️', '🖌️', '🖼️'],
      },
    ],
    'CDP-003': [],
  }
  const nftWrappers = $derived(nftWrappersByCdp[selectedCDP] ?? [])

  // Health and status handled by imported components
  function parseUsdStr(s: string): number {
    return Number.parseFloat(s.replace(/[$,\s]/g, '')) || 0
  }
  function parseUnitsStr(s: string): number {
    return Number.parseFloat(s.replace(/[,\s]/g, '')) || 0
  }

  // CDP form modal state and derived data
  let formOpen = $state(false)
  let presetType: 'add_collateral' | 'remove_collateral' | 'borrow' | 'repay' | undefined
    = $state()
  let presetAsset: string | undefined = $state()
  function openCdpForm(
    type?: 'add_collateral' | 'remove_collateral' | 'borrow' | 'repay',
    asset?: string,
  ) {
    presetType = type
    presetAsset = asset
    formOpen = true
  }

  const collateralAssets = $derived.by(() => {
    const map = new Map<string, { symbol: string, logo: string }>()
    if (currentCDP) {
      for (const c of currentCDP.collaterals) map.set(c.asset, { symbol: c.asset, logo: c.logo })
    }
    // include available collaterals as options too
    for (const a of availableCollaterals) map.set(a.asset, { symbol: a.asset, logo: a.logo })
    return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol))
  })
  const debtAssets = $derived.by(() => {
    const map = new Map<string, { symbol: string, logo: string }>()
    if (currentCDP) {
      for (const l of currentCDP.loans) map.set(l.asset, { symbol: l.asset, logo: l.logo })
    }
    // include available loan resources as options too
    for (const lr of availableLoanResources) map.set(lr.asset, { symbol: lr.asset, logo: lr.logo })
    return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol))
  })
  const prices = $derived.by(() => {
    const p: Record<string, number> = {}
    if (currentCDP) {
      for (const c of currentCDP.collaterals) p[c.asset] = parseUsdStr(c.price)
      for (const l of currentCDP.loans) p[l.asset] = parseUsdStr(l.price)
    }
    return p
  })
  const ltv = $derived.by(() => {
    const m: Record<string, number> = {}
    if (currentCDP) {
      for (const c of currentCDP.collaterals) {
        if (c.ltv)
          m[c.asset] = Number(String(c.ltv).replace(/[%\s]/g, '')) / 100
      }
    }
    return m
  })
  const currentCollateralUSD = $derived.by(() => {
    const rec: Record<string, number> = {}
    if (currentCDP) {
      for (const c of currentCDP.collaterals) rec[c.asset] = parseUnitsStr(c.amount)
    }
    return rec
  })
  const currentDebtUSD = $derived.by(() => {
    const rec: Record<string, number> = {}
    if (currentCDP) {
      for (const l of currentCDP.loans) rec[l.asset] = parseUnitsStr(l.borrowed)
    }
    return rec
  })
  const balancesCollateral = $derived.by(() => ({ ...currentCollateralUSD }))
  const balancesDebt = $derived.by(() => ({ ...currentDebtUSD }))
</script>

<div class='space-y-6'>
  <div class='flex items-center justify-between'>
    <div>
      <h2 class='text-2xl font-semibold'>CDP Management</h2>
      <p class='opacity-70'>Manage your collateralized debt positions</p>
    </div>
    <button class='btn btn-primary' onclick={() => openCdpForm('add_collateral')}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        class='mr-2 h-4 w-4'
      ><path
        stroke-linecap='round'
        stroke-linejoin='round'
        stroke-width='2'
        d='M12 4v16m8-8H4'
      /></svg
      >
      Create New CDP
    </button>
  </div>

  <!-- CDP Selector -->
  <div class='card bg-base-200/60'>
    <div class='card-body py-3'>
      <div class='flex items-center gap-3'>
        <h2 class='m-0 card-title shrink-0'>Your CDPs</h2>
        <div class='flex-1 overflow-x-auto'>
          <div class='ml-auto flex w-max items-center justify-end gap-2'>
            {#each cdpPositions as cdp}
              <button
                class={`btn btn-sm ${selectedCDP === cdp.id ? 'btn-active btn-outline' : 'btn-ghost'}`}
                onclick={() => (selectedCDP = cdp.id)}
              >
                <span class='font-medium'>{cdp.id}</span>
                <span class='ml-2'><HealthPill ltv={dec(cdp.healthRatio)} /></span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if currentCDP}
    <div class='space-y-6'>
      <div class='card-compact card bg-base-200/60'>
        <div class='card-body py-3'>
          <div class='flex items-center justify-between'>
            <h2 class='card-title text-base'>{currentCDP.id} Overview</h2>
            <!-- <StatusBadge status={currentCDP.status} /> -->
          </div>

          <div class='mt-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
            <div>
              <div class='text-sm opacity-70'>Total Collateral</div>
              <div class='text-lg font-semibold'>{currentCDP.totalCollateral}</div>
            </div>
            <div>
              <div class='text-sm opacity-70'>Total Debt</div>
              <div class='text-lg font-semibold'>{currentCDP.totalDebt}</div>
            </div>
            <div>
              <div class='text-sm opacity-70'>Liquidation Price</div>
              <div class='text-lg font-semibold'>{currentCDP.liquidationPrice}</div>
            </div>
            <div>
              <div class='text-sm opacity-70'>Health</div>
              <div class='text-lg font-semibold'>
                <HealthPill ltv={dec(currentCDP.healthRatio)} showValue={true} />
              </div>
            </div>
          </div>

          <!-- <div class="mt-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs opacity-70">Health Ratio</span>
              <span class="text-xs">{currentCDP.healthRatio < 1.5 ? 'Risk of Liquidation' : 'Safe'}</span>
            </div>
            <progress class="progress progress-primary h-2" max="100" value={Math.min(currentCDP.healthRatio * 25, 100)}></progress>
            <div class="flex justify-between text-[10px] opacity-70 mt-1">
              <span>1.0 (Liquidation)</span>
              <span>2.0+ (Safe)</span>
            </div>
          </div> -->

          <!-- {#if currentCDP.healthRatio < 1.5}
            <div role="alert" class="alert alert-warning mt-3 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"/></svg>
              <span>Your CDP is at risk of liquidation. Consider adding more collateral or repaying debt.</span>
            </div>
          {/if} -->
        </div>
      </div>

      <div class='space-y-6'>
        <div class='card bg-base-200/60'>
          <div class='card-body'>
            <div class='flex items-center justify-between'>
              <h3 class='card-title'>Collaterals</h3>
              <button class='btn btn-outline btn-sm' onclick={() => openCdpForm('add_collateral')}
              >Add</button
              >
            </div>

            <div class='mt-2'>
              <Tabs>
                <Tab id='normal' bind:activeId={collatTab} label='Normal' />
                <Tab id='ftw' bind:activeId={collatTab} label='Fungible Wrappers' />
                <Tab id='nftw' bind:activeId={collatTab} label='NFT Wrappers' />
              </Tabs>
            </div>

            {#if collatTab === 'normal'}
              <div class='mt-3 space-y-3'>
                {#each currentCDP.collaterals as collateral}
                  <ListRow>
                    {#snippet left()}
                      <TokenCell
                        logo={collateral.logo}
                        symbol={collateral.asset}
                        price={collateral.price}
                        change={collateral.change24h}
                        isPositive={collateral.isPositive}
                      />
                    {/snippet}
                    {#snippet right()}
                      <div class='flex items-center gap-6'>
                        <div class='text-right'>
                          <AmountDisplay
                            amount={dec(parseUnitsStr(collateral.amount))}
                            usd={dec(parseUsdStr(collateral.value))}
                          />
                        </div>
                        <div class='text-right'>
                          <div class='text-sm opacity-70'>LTV</div>
                          <div class='font-medium'>{collateral.ltv ?? '-'}</div>
                        </div>
                        <div class='flex gap-2'>
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('add_collateral', collateral.asset)}
                          >Add</button
                          >
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('remove_collateral', collateral.asset)}
                          >Remove</button
                          >
                        </div>
                      </div>
                    {/snippet}
                  </ListRow>
                {/each}
              </div>
            {:else if collatTab === 'ftw'}
              <div class='mt-3 space-y-3'>
                {#each ftWrappers as w}
                  <ListRow>
                    {#snippet left()}
                      <div class='flex items-center gap-3'>
                        <div class='font-medium'>{w.wrapper}</div>
                        <div class='badge badge-outline badge-xs'>Wrapper</div>
                        <div class='flex -space-x-2'>
                          {#each w.underlyings.slice(0, 4) as u}
                            <div class='placeholder avatar'>
                              <div
                                class='flex h-6 w-6 items-center justify-center rounded-full bg-base-200 text-[10px] ring ring-base-100 ring-offset-1'
                              >
                                {u.logo}
                              </div>
                            </div>
                          {/each}
                          {#if w.underlyings.length > 4}
                            <div class='placeholder avatar'>
                              <div
                                class='flex h-6 w-6 items-center justify-center rounded-full bg-base-300 text-[10px] ring ring-base-100 ring-offset-1'
                              >
                                +{w.underlyings.length - 4}
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/snippet}
                    {#snippet right()}
                      <div class='flex items-center gap-6'>
                        <div class='text-right'>
                          <AmountDisplay amount={dec(w.shares)} usd={dec(w.usd)} />
                        </div>
                        <div class='flex gap-2'>
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('add_collateral')}>Add</button
                          >
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('remove_collateral')}>Remove</button
                          >
                          <button class='btn btn-outline btn-sm'>Unwrap</button>
                        </div>
                      </div>
                    {/snippet}
                  </ListRow>
                {/each}
              </div>
            {:else}
              <div class='mt-3 space-y-3'>
                {#each nftWrappers as n}
                  <ListRow>
                    {#snippet left()}
                      <div class='flex items-center gap-3'>
                        <div class='font-medium'>{n.collection}</div>
                        <div class='badge badge-outline badge-xs'>NFT Wrapper</div>
                        <div class='flex -space-x-2'>
                          {#each n.icons.slice(0, 4) as ic}
                            <div class='placeholder avatar'>
                              <div
                                class='flex h-6 w-6 items-center justify-center rounded-full bg-base-200 text-[10px] ring ring-base-100 ring-offset-1'
                              >
                                {ic}
                              </div>
                            </div>
                          {/each}
                          {#if n.icons.length > 4}
                            <div class='placeholder avatar'>
                              <div
                                class='flex h-6 w-6 items-center justify-center rounded-full bg-base-300 text-[10px] ring ring-base-100 ring-offset-1'
                              >
                                +{n.icons.length - 4}
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/snippet}
                    {#snippet right()}
                      <div class='flex items-center gap-6'>
                        <div class='text-right'>
                          <AmountDisplay amount={dec(n.count)} usd={dec(n.usd)} />
                        </div>
                        <div class='flex gap-2'>
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('add_collateral')}>Add</button
                          >
                          <button
                            class='btn btn-outline btn-sm'
                            onclick={() => openCdpForm('remove_collateral')}>Remove</button
                          >
                          <button class='btn btn-outline btn-sm'>Unwrap</button>
                        </div>
                      </div>
                    {/snippet}
                  </ListRow>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class='card-compact card bg-base-200/60'>
          <div class='card-body py-3'>
            <div class='flex items-center justify-between'>
              <h3 class='card-title'>Borrowed Assets</h3>
              <button class='btn btn-outline btn-sm' onclick={() => openCdpForm('borrow')}
              >Borrow</button
              >
            </div>

            <div class='mt-3 space-y-3'>
              {#each currentCDP.loans as loan}
                <ListRow>
                  {#snippet left()}
                    <TokenCell
                      logo={loan.logo}
                      symbol={loan.asset}
                      price={loan.price}
                      change={loan.change24h}
                      isPositive={loan.isPositive}
                    />
                  {/snippet}
                  {#snippet right()}
                    <div class='flex items-center gap-6'>
                      <div class='text-right'>
                        <AmountDisplay
                          amount={dec(parseUnitsStr(loan.borrowed))}
                          usd={dec(parseUsdStr(loan.price)).mul(dec(parseUnitsStr(loan.borrowed)))}
                        />
                      </div>
                      <div class='text-right'>
                        <div class='text-sm opacity-70'>Interest</div>
                        <div class='font-medium text-warning'>{loan.interestRate}</div>
                      </div>
                      <div class='flex gap-2'>
                        <button
                          class='btn btn-outline btn-sm'
                          onclick={() => openCdpForm('repay', loan.asset)}>Repay</button
                        >
                        <button
                          class='btn btn-outline btn-sm'
                          onclick={() => openCdpForm('borrow', loan.asset)}>Borrow</button
                        >
                      </div>
                    </div>
                  {/snippet}
                </ListRow>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class='text-error'>CDP not found</div>
  {/if}
</div>

<!-- CDP update modal -->
<CDPForm
  bind:open={formOpen}
  {presetType}
  {presetAsset}
  {collateralAssets}
  {debtAssets}
  {prices}
  {ltv}
  currentCollateral={currentCollateralUSD}
  currentDebt={currentDebtUSD}
  {balancesCollateral}
  {balancesDebt}
  on:submit={() => (formOpen = false)}
/>
