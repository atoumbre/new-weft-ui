<script lang='ts'>
  import { createEventDispatcher } from 'svelte'

  type ActionType = 'supply' | 'withdraw'
  type Asset = { symbol: string, logo: string, decimals?: number }
  type TxAction = { id: string, type: ActionType, asset: string, amount: number }

  type Props = {
    supportedAssets?: Asset[]
    balances?: Record<string, number> // for withdraw MAX suggestions
    // Modal/prefill controls
    open?: boolean
    presetType?: ActionType
    presetAsset?: string
    presetAmount?: number | string
  }

  let {
    supportedAssets = [
      { symbol: 'USDC', logo: '💰' },
      { symbol: 'USDT', logo: '💵' },
      { symbol: 'DAI', logo: '🪙' },
      { symbol: 'ETH', logo: '⟠' },
      { symbol: 'WBTC', logo: '₿' },
      { symbol: 'LINK', logo: '🔗' },
      { symbol: 'MATIC', logo: '🔷' },
    ],
    balances = {},
    open = $bindable<boolean>(false),
    presetType,
    presetAsset,
    presetAmount,
  }: Props = $props()

  const dispatch = createEventDispatcher<{ submit: { actions: TxAction[] } }>()

  // Row-based builder (like CDPForm)
  type Row = { id: string, type: ActionType, asset: string, amountStr: string }
  let invalid = $state<string | null>(null)
  let rows = $state<Row[]>([])

  // UI: add action dropdown state
  let addMenuOpen = $state(false)
  function chooseAdd(t: ActionType) {
    addRow(t)
    addMenuOpen = false
  }

  function parseAmount(s: string): number {
    const n = Number.parseFloat(s.replace(/[,\s]/g, ''))
    return Number.isFinite(n) ? Math.max(0, n) : 0
  }

  // Derived actions from rows
  const actions = $derived(
    rows.map(r => ({ id: r.id, type: r.type, asset: r.asset, amount: parseAmount(r.amountStr) })),
  )

  function setRowAsset(id: string, asset: string) {
    rows = rows.map(r => (r.id === id ? { ...r, asset } : r))
  }

  function setRowAmount(id: string, amountStr: string) {
    rows = rows.map(r => (r.id === id ? { ...r, amountStr } : r))
  }

  function rowValid(r: Row): boolean {
    if (!r.asset)
      return false
    const amt = parseAmount(r.amountStr)
    if (!amt)
      return false
    if (r.type === 'withdraw') {
      const bal = balances[r.asset]
      if (typeof bal === 'number' && amt > bal)
        return false
    }
    return true
  }

  const allValid = $derived(rows.length > 0 && rows.every(rowValid))
  const canSubmit = $derived(allValid)

  function addRow(type: ActionType) {
    invalid = null
    // Asset starts empty; user must choose explicitly
    const defaultAsset = ''
    rows = [
      ...rows,
      {
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        type,
        asset: defaultAsset,
        amountStr: '',
      },
    ]
  }

  function removeRow(id: string) {
    rows = rows.filter(r => r.id !== id)
  }

  function clearAll() {
    rows = []
  }

  // Prefill on open
  $effect(() => {
    if (!open)
      return
    invalid = null
    // Initialize rows with one row; asset remains empty
    const initialType: ActionType = presetType ?? 'supply'
    const initialAsset = presetAsset ?? ''
    const initialAmount
      = presetAmount !== undefined && presetAmount !== null ? String(presetAmount) : ''
    rows = [
      {
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        type: initialType,
        asset: initialAsset,
        amountStr: initialAmount,
      },
    ]
  })

  function submit() {
    invalid = null
    if (!allValid) {
      invalid = 'Add at least one valid action and complete all fields.'
      return
    }
    const finalActions = actions // no dedup; keep user-entered rows as-is
    dispatch('submit', { actions: finalActions })
    open = false
  }

  function setPctForRow(row: Row, pct: number) {
    if (row.type === 'withdraw') {
      const bal = balances[row.asset]
      if (typeof bal === 'number') {
        setRowAmount(row.id, (bal * pct).toString())
      }
    }
  }
</script>

<!-- Modal wrapper -->
<div class={`modal ${open ? 'modal-open' : ''}`} role='dialog' aria-modal={open}>
  <div class='modal-box max-w-4xl'>
    <button
      class='btn absolute top-2 right-2 btn-circle btn-ghost btn-sm'
      aria-label='Close'
      onclick={() => (open = false)}>✕</button
    >
    <h3 class='mb-2 text-lg font-semibold'>Supply / Withdraw</h3>

    <div class='space-y-4'>
      {#if invalid}
        <div role='alert' class='alert alert-warning py-2 text-sm'>
          <span>{invalid}</span>
        </div>
      {/if}

      <div class='card bg-base-200/60'>
        <div class='card-body space-y-3 p-3 sm:p-4'>
          <div class='flex items-center justify-between'>
            <div class='card-title text-base'>Actions</div>
            <div class='flex items-center gap-3'>
              <div class='text-xs opacity-70'>{rows.length} rows</div>
              <button class='btn btn-ghost btn-xs' onclick={clearAll} disabled={!rows.length}
              >Clear</button
              >
            </div>
          </div>

          <!-- Rows -->
          <div class='space-y-2'>
            {#each rows as r (r.id)}
              <div
                class='grid grid-cols-1 items-center gap-2 md:grid-cols-[auto_1fr_auto_auto_auto]'
              >
                <div>
                  <div class='badge badge-ghost'>
                    {r.type === 'supply' ? 'Supply' : 'Withdraw'}
                  </div>
                </div>
                <select
                  class='select-bordered select select-sm'
                  value={r.asset}
                  aria-label='Asset'
                  onchange={e => setRowAsset(r.id, (e.target as HTMLSelectElement).value)}
                >
                  <option value="">Select asset</option>
                  {#each supportedAssets as a}
                    <option value={a.symbol}>{a.logo} {a.symbol}</option>
                  {/each}
                </select>
                <div class='flex items-center gap-2'>
                  <input
                    class='input-bordered input input-sm w-40'
                    type='text'
                    inputmode='decimal'
                    placeholder='Amount'
                    value={r.amountStr}
                    aria-label='Amount'
                    oninput={e => setRowAmount(r.id, (e.target as HTMLInputElement).value)}
                  />
                  {#if r.type === 'withdraw' && typeof balances[r.asset] === 'number'}
                    <div class='join hidden sm:flex'>
                      <button class='btn join-item btn-xs' onclick={() => setPctForRow(r, 0.25)}
                      >25%</button
                      >
                      <button class='btn join-item btn-xs' onclick={() => setPctForRow(r, 0.5)}
                      >50%</button
                      >
                      <button class='btn join-item btn-xs' onclick={() => setPctForRow(r, 1)}
                      >MAX</button
                      >
                    </div>
                  {/if}
                </div>
                <div class='text-right'>
                  <button
                    class='btn btn-ghost btn-xs'
                    aria-label='Remove'
                    onclick={() => removeRow(r.id)}>✕</button
                  >
                </div>
              </div>
            {/each}
          </div>

          <!-- Add action dropdown -->
          <div class='flex justify-center pt-1'>
            <div class={`dropdown dropdown-top ${addMenuOpen ? 'dropdown-open' : ''}`}>
              <button
                type='button'
                class='btn btn-sm btn-primary'
                onclick={() => (addMenuOpen = !addMenuOpen)}
              >
                Add action
              </button>
              <ul class='dropdown-content menu z-[1] w-56 rounded-box bg-base-200 p-2 shadow'>
                <li><button type='button' onclick={() => chooseAdd('supply')}>Supply</button></li>
                <li>
                  <button type='button' onclick={() => chooseAdd('withdraw')}>Withdraw</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit section -->
      <div class='flex justify-end'>
        <button class='btn btn-sm btn-primary' onclick={submit} disabled={!canSubmit}
        >Review & Submit</button
        >
      </div>
    </div>
  </div>
  <div
    class='modal-backdrop'
    onclick={() => (open = false)}
    onkeydown={e => e.key === 'Escape' && (open = false)}
    role='button'
    tabindex='0'
  ></div>
</div>
