<script lang='ts'>
  import type {
    CollateralizeDebtPositionData,
    CollateralPositionData,
    LoanPositionData,
    NFTCollateralPositionData,
  } from '$lib/internal_modules/weft-ledger-state'
  import type { WeftUserAccountData } from '$lib/stores/user-accounts.svelte'
  import type Decimal from 'decimal.js'
  import CDPForm from '$lib/components/forms/CDPForm.svelte'
  import { getMarketInfoStore } from '$lib/stores/market-info.svelte'
  import { getMetadataService } from '$lib/stores/metadata-service.svelte'
  import { getPriceStore } from '$lib/stores/price-store.svelte'
  import { getRadixToolkitStore } from '$lib/stores/rdt.svelte'
  import { getUserAccountsStore } from '$lib/stores/user-accounts.svelte'
  import { getXRDPriceStore } from '$lib/stores/xrd-price-store.svelte'
  import { dec, fValue } from '$lib/utils/common'
  import { onMount } from 'svelte'
  import CDPBorrowedSection from './components/CDPBorrowedSection.svelte'
  import CDPCollateralSection from './components/CDPCollateralSection.svelte'
  import CDPEmptyState from './components/CDPEmptyState.svelte'
  import CDPHeader from './components/CDPHeader.svelte'
  import CDPOverview from './components/CDPOverview.svelte'
  import CDPSidebar from './components/CDPSidebar.svelte'
  import CDPStats from './components/CDPStats.svelte'

  const userAccountsStore = getUserAccountsStore()
  const rdtStore = getRadixToolkitStore()
  const marketInfoStore = getMarketInfoStore()
  const priceStore = getPriceStore()
  const xrdPriceStore = getXRDPriceStore()
  const metadataService = getMetadataService()

  onMount(() => {
    if (marketInfoStore.status === 'not loaded') {
      marketInfoStore.loadMarketInfo().then(() => {
        priceStore.loadPrices(marketInfoStore.allResourceAddressesWithPrice)
      })
    }
  })

  type ActionType = 'add_collateral' | 'remove_collateral' | 'borrow' | 'repay'

  let formOpen = $state(false)
  let presetType: ActionType | undefined = $state()
  let presetAsset: string | undefined = $state()
  let selectedAccountAddress = $state('')
  let selectedCdpId = $state('')

  function openCdpForm(type?: ActionType, asset?: string) {
    presetType = type
    presetAsset = asset
    formOpen = true
  }

  function shortenAddress(address: string, prefix = 6, suffix = 6): string {
    if (!address || address.length <= prefix + suffix)
      return address
    return `${address.slice(0, prefix)}...${address.slice(-suffix)}`
  }

  function formatCdpId(id: string): string {
    if (!id)
      return ''
    return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id
  }

  function decimalToNumber(value?: Decimal | null): number {
    if (!value)
      return 0
    return value.toNumber()
  }

  function convertToUsd(value?: Decimal | null): Decimal {
    if (!value)
      return dec(0)
    return value.mul(xrdPriceStore.xrdPrice)
  }

  function fValueCompact(amount: Decimal): string {
    const value = amount.toNumber()
    if (value >= 1000000)
      return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000)
      return `$${(value / 1000).toFixed(1)}K`
    return fValue(amount)
  }

  let collateralTab = $state<'fungible' | 'nft'>('fungible')

  type AccountOption = {
    address: string
    label: string
    data: WeftUserAccountData
  }

  const accountOptions = $derived.by((): AccountOption[] => {
    const walletAccounts = rdtStore.walletData?.accounts ?? []
    const walletByAddress = new Map(walletAccounts.map(acc => [acc.address, acc]))

    return (userAccountsStore.accounts ?? [])
      .filter((account): account is WeftUserAccountData => !!account?.address)
      .map((account) => {
        const wallet = walletByAddress.get(account.address)
        const label = (wallet as any)?.label ?? shortenAddress(account.address)
        return { address: account.address, label, data: account }
      })
  })

  $effect(() => {
    const addresses = accountOptions.map(option => option.address)
    if (!addresses.length) {
      if (selectedAccountAddress !== '')
        selectedAccountAddress = ''
      return
    }

    if (!addresses.includes(selectedAccountAddress)) {
      const fallback = addresses[0]
      if (selectedAccountAddress !== fallback)
        selectedAccountAddress = fallback
    }
  })

  const selectedAccountOption = $derived(
    accountOptions.find(option => option.address === selectedAccountAddress),
  )
  const selectedAccount = $derived(selectedAccountOption?.data)

  const cdpList = $derived(
    (selectedAccount?.cdps ?? []) as CollateralizeDebtPositionData[],
  )

  $effect(() => {
    const ids = cdpList.map(cdp => cdp.id)
    if (!ids.length) {
      if (selectedCdpId !== '')
        selectedCdpId = ''
      return
    }

    if (!ids.includes(selectedCdpId)) {
      const fallback = ids[0]
      if (selectedCdpId !== fallback)
        selectedCdpId = fallback
    }
  })

  const currentCdp = $derived(
    cdpList.find(cdp => cdp.id === selectedCdpId),
  )

  const currentCollateralList = $derived.by(() => {
    if (!currentCdp)
      return [] as Array<{ address: string, collateral: CollateralPositionData }>

    return Object.entries(currentCdp.collateralPositions ?? {})
      .map(([address, collateral]) => ({ address, collateral }))
      .sort((a, b) => b.collateral.value.comparedTo(a.collateral.value))
  })

  const currentLoanList = $derived.by(() => {
    if (!currentCdp)
      return [] as Array<{ address: string, loan: LoanPositionData }>

    return Object.entries(currentCdp.loanPositions ?? {})
      .map(([address, loan]) => ({ address, loan }))
      .sort((a, b) => b.loan.value.comparedTo(a.loan.value))
  })

  const nftCollateralList = $derived.by(() => {
    if (!currentCdp)
      return [] as Array<[string, NFTCollateralPositionData]>

    return Object.entries(currentCdp.nftCollateralPositions ?? {}) as Array<
      [string, NFTCollateralPositionData]
    >
  })

  // type ResourceMeta = {
  //   symbol: string
  //   name: string
  //   logo: string
  //   iconUrl?: string
  //   priceUsd: Decimal
  //   previousPriceUsd: Decimal
  //   changePct: Decimal | null
  //   collateralLtv?: Decimal
  //   borrowingApr?: Decimal
  // }

  // function extractIconUrl(metadata?: Record<string, string>) {
  //   if (!metadata)
  //     return undefined
  //   const keys = ['iconUrl', 'icon_url', 'icon_url_256', 'icon_url_128', 'icon_url_64']
  //   for (const key of keys) {
  //     const value = metadata[key]
  //     if (value)
  //       return value
  //   }
  //   return undefined
  // }

  // const baseMeta = (
  //   address: string,
  //   metadata?: Record<string, string>,
  // ): Pick<ResourceMeta, 'symbol' | 'name' | 'logo'> => {
  //   const symbol = metadata?.symbol || metadata?.name || shortenAddress(address)
  //   const name = metadata?.name ?? symbol
  //   const logo = (metadata?.symbol ?? symbol).slice(0, 3)
  //   return { symbol, name, logo }
  // }

  // const buildPrice = (address: string) => {
  //   const { current, previous } = priceStore.getPrice(address)
  //   const priceUsd = xrdPriceStore.xrdPrice.mul(current)
  //   const previousPriceUsd = xrdPriceStore.xrdPreviousPrice.mul(previous)
  //   const changePct = previousPriceUsd.isZero()
  //     ? null
  //     : priceUsd.sub(previousPriceUsd).div(previousPriceUsd).mul(100)
  //   return { priceUsd, previousPriceUsd, changePct }
  // }

  // const resourceMeta = $derived.by(() => {
  //   const map = new Map<string, ResourceMeta>()

  //   // Base collateral resources
  //   marketInfoStore.collateralResources.forEach((resource) => {
  //     const metadata = metadataService.resourceInfoState.get(resource?.resourceAddress)?.metadata

  //     const base = baseMeta(resource.resourceAddress, metadata)
  //     const price = buildPrice(resource.resourceAddress)
  //     const iconUrl = extractIconUrl(metadata)
  //     map.set(resource.resourceAddress, {
  //       ...base,
  //       ...price,
  //       collateralLtv: resource.riskConfig.loanToValueRatio,
  //       iconUrl,
  //     })
  //   })

  //   // Base loan resources
  //   marketInfoStore.loanResources.forEach((resource) => {
  //     const metadata = metadataService.resourceInfoState.get(resource?.resourceAddress)?.metadata

  //     const existing = map.get(resource.resourceAddress)
  //     const base = existing ?? baseMeta(resource.resourceAddress, metadata)
  //     const price = buildPrice(resource.resourceAddress)
  //     const iconUrl = extractIconUrl(metadata)
  //     map.set(resource.resourceAddress, {
  //       ...base,
  //       ...price,
  //       collateralLtv: existing?.collateralLtv,
  //       borrowingApr: resource.lendingPoolState?.borrowingApr,
  //       iconUrl: existing?.iconUrl ?? iconUrl,
  //     })
  //   })

  //   // Deposit Unit resources (as separate resources)
  //   marketInfoStore.loanResources.forEach((resource) => {
  //     const pool = resource.lendingPoolState
  //     const duAddress = pool?.depositUnitAddress
  //     if (!duAddress)
  //       return
  //     const duMeta = metadataService.resourceInfoState.get(resource?.resourceAddress)?.metadata

  //     const basePrice = buildPrice(resource.resourceAddress).priceUsd
  //     const duPriceUsd = pool?.depositUnitPrice ? basePrice.mul(pool.depositUnitPrice) : basePrice
  //     const base = baseMeta(duAddress, duMeta)
  //     const iconUrl = extractIconUrl(duMeta)
  //     map.set(duAddress, {
  //       ...base,
  //       priceUsd: duPriceUsd,
  //       previousPriceUsd: duPriceUsd, // fallback (no 24h for DU)
  //       changePct: null,
  //       collateralLtv: undefined,
  //       borrowingApr: undefined,
  //       iconUrl,
  //     })
  //   })

  //   // LSU resources
  //   marketInfoStore.lsuAmounts.forEach((lsu) => {
  //     const base = baseMeta(lsu.resourceAddress, lsu.metadata)
  //     const iconUrl = extractIconUrl(lsu.metadata)
  //     const priceUsd = xrdPriceStore.xrdPrice.mul(lsu.unitRedemptionValue)
  //     map.set(lsu.resourceAddress, {
  //       ...base,
  //       priceUsd,
  //       previousPriceUsd: priceUsd, // fallback same-day value
  //       changePct: null,
  //       collateralLtv: undefined,
  //       borrowingApr: undefined,
  //       iconUrl,
  //     })
  //   })

  //   return map
  // })

  let priceAddressesKey = ''
  $effect(() => {
    const addresses = marketInfoStore.allResourceAddressesWithPrice ?? []
    if (!addresses.length)
      return

    const key = [...addresses].sort().join(',')
    if (key && key !== priceAddressesKey) {
      priceAddressesKey = key
      priceStore.loadPrices(addresses)
    }
  })

  const collateralAssets = $derived.by(() => {
    const seen = new Set<string>()
    const assets: { symbol: string, logo: string }[] = []

    marketInfoStore.collateralResources.forEach((resource) => {
      const meta = metadataService.resourceInfoState.get(resource.resourceAddress)?.metadata ?? {}
      const symbol = meta?.symbol ?? shortenAddress(resource.resourceAddress)
      if (seen.has(symbol))
        return
      seen.add(symbol)
      assets.push({ symbol, logo: meta?.logo ?? symbol.slice(0, 3) })
    })

    return assets
  })

  const debtAssets = $derived.by(() => {
    const seen = new Set<string>()
    const assets: { symbol: string, logo: string }[] = []

    marketInfoStore.loanResources.forEach((resource) => {
      const meta = metadataService.resourceInfoState.get(resource.resourceAddress)?.metadata ?? {}
      const symbol = meta?.symbol ?? shortenAddress(resource.resourceAddress)
      if (seen.has(symbol))
        return
      seen.add(symbol)
      assets.push({ symbol, logo: meta?.logo ?? symbol.slice(0, 3) })
    })

    return assets
  })

  // const prices = $derived.by(() => {
  //   const map: Record<string, number> = {}
  //   resourceMeta.forEach((meta) => {
  //     if (!meta.symbol || !meta.priceUsd)
  //       return
  //     if (!(meta.symbol in map))
  //       map[meta.symbol] = meta.priceUsd.toNumber()
  //   })
  //   return map
  // })

  const ltv = $derived.by(() => {
    const map: Record<string, number> = {}
    marketInfoStore.collateralResources.forEach((resource) => {
      const meta = metadataService.resourceInfoState.get(resource.resourceAddress)?.metadata ?? {}

      const symbol = meta?.symbol ?? shortenAddress(resource.resourceAddress)
      map[symbol] = resource.riskConfig.loanToValueRatio.toNumber()
    })
    return map
  })

  const currentCollateralUSD = $derived.by(() => {
    const map: Record<string, number> = {}
    if (!currentCdp)
      return map

    Object.entries(currentCdp.collateralPositions ?? {}).forEach(([address, collateral]) => {
      const meta = metadataService.resourceInfoState.get(address)?.metadata ?? {}

      const symbol = meta?.symbol ?? shortenAddress(address)
      map[symbol] = decimalToNumber(collateral.amount)
    })

    return map
  })

  const currentDebtUSD = $derived.by(() => {
    const map: Record<string, number> = {}
    if (!currentCdp)
      return map

    Object.entries(currentCdp.loanPositions ?? {}).forEach(([address, loan]) => {
      const meta = metadataService.resourceInfoState.get(address)?.metadata ?? {}

      const symbol = meta?.symbol ?? shortenAddress(address)
      map[symbol] = decimalToNumber(loan.amount)
    })

    return map
  })

  const balancesCollateral = $derived.by(() => ({ ...currentCollateralUSD }))
  const balancesDebt = $derived.by(() => ({ ...currentDebtUSD }))

  const walletAccountCount = $derived(rdtStore.walletData?.accounts?.length ?? 0)

  const borrowingPower = $derived.by(() => {
    if (!currentCdp)
      return dec(0)

    // Borrowing power = discounted collateral value - current loan value
    const availableBorrowingPower = currentCdp.discountedCollateralValue.sub(currentCdp.totalLoanValue)
    return availableBorrowingPower.greaterThan(dec(0)) ? availableBorrowingPower : dec(0)
  })
</script>

<svelte:head>
  <title>CDP Management - Weft</title>
</svelte:head>

<div class='container mx-auto space-y-6 px-4 py-8'>
  <CDPHeader
    {selectedAccount}
    onCreateCDP={() => openCdpForm('add_collateral')}
  />

  <CDPStats
    {cdpList}
    {currentCdp}
    {convertToUsd}
  />

  <div class='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]'>
    <CDPSidebar
      {accountOptions}
      {selectedAccountAddress}
      {cdpList}
      {selectedCdpId}
      userAccountsLoading={userAccountsStore.loading}
      {walletAccountCount}
      {formatCdpId}
      {fValueCompact}
      {convertToUsd}
      onAccountChange={address => selectedAccountAddress = address}
      onCdpSelect={id => selectedCdpId = id}
    />

    <!-- Main Content -->
    <section class='space-y-6'>
      {#if selectedAccount && currentCdp}
        <CDPOverview
          {currentCdp}
          {formatCdpId}
          {convertToUsd}
          {borrowingPower}
        />

        <CDPCollateralSection
          bind:collateralTab
          {currentCollateralList}
          {nftCollateralList}
          {convertToUsd}
          {shortenAddress}
          {formatCdpId}
          onAddCollateral={symbol => openCdpForm('add_collateral', symbol)}
          onRemoveCollateral={symbol => openCdpForm('remove_collateral', symbol)}
        />

        <CDPBorrowedSection
          {currentLoanList}
          onBorrow={symbol => openCdpForm('borrow', symbol)}
          onRepay={symbol => openCdpForm('repay', symbol)}
        />
      {:else if selectedAccount && !userAccountsStore.loading}
        <CDPEmptyState
          title='No CDPs found for the selected account'
          subtitle='Create your first CDP to get started'
        />
      {:else if userAccountsStore.loading}
        <CDPEmptyState
          title='Loading account data...'
          subtitle=""
          isLoading={true}
        />
      {:else}
        <CDPEmptyState
          title='Connect your Radix wallet to manage CDPs'
          subtitle='Access your collateralized debt positions'
        />
      {/if}
    </section>
  </div>
</div>

<CDPForm
  bind:open={formOpen}
  {presetType}
  {presetAsset}
  {collateralAssets}
  {debtAssets}
  {ltv}
  currentCollateral={currentCollateralUSD}
  currentDebt={currentDebtUSD}
  {balancesCollateral}
  {balancesDebt}
  on:submit={() => (formOpen = false)}
/>

{JSON.stringify(selectedAccount)}
{currentCdp?.healthLtv}
