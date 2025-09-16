<script lang="ts">
  import HealthPill from '$lib/components/common/HealthPill.svelte';
  import AmountDisplay from '$lib/components/common/AmountDisplay.svelte';
  import { dec } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';

  type ActionType = 'add_collateral' | 'remove_collateral' | 'borrow' | 'repay';
  type Asset = { symbol: string; logo: string; decimals?: number };
  type CdpAction = { id: string; type: ActionType; asset: string; amount: number };

  type Props = {
    open?: boolean;
    presetType?: ActionType;
    presetAsset?: string;
    presetAmount?: number | string;

    collateralAssets?: Asset[];
    debtAssets?: Asset[];

    prices?: Record<string, number>; // USD per unit
    ltv?: Record<string, number>; // 0..1
    liqThreshold?: Record<string, number>; // 0..1 used for health factor

    // Current position amounts (units, not USD)
    currentCollateral?: Record<string, number>;
    currentDebt?: Record<string, number>;

    // Balances to validate removes/repays
    balancesCollateral?: Record<string, number>;
    balancesDebt?: Record<string, number>;
  };

  let {
    open = $bindable<boolean>(false),
    presetType,
    presetAsset,
    presetAmount,
    collateralAssets = [
      { symbol: 'ETH', logo: '⟠' },
      { symbol: 'WBTC', logo: '₿' },
      { symbol: 'LINK', logo: '🔗' },
      { symbol: 'MATIC', logo: '🔷' }
    ],
    debtAssets = [
      { symbol: 'USDC', logo: '💰' },
      { symbol: 'USDT', logo: '💵' },
      { symbol: 'DAI', logo: '🪙' }
    ],
    prices = { ETH: 2485.67, WBTC: 67234.12, LINK: 15.0, MATIC: 0.9, USDC: 1, USDT: 1, DAI: 1 },
    ltv = { ETH: 0.75, WBTC: 0.7, LINK: 0.65, MATIC: 0.6 },
    liqThreshold = { ETH: 0.85, WBTC: 0.8, LINK: 0.75, MATIC: 0.7 },
    currentCollateral = {},
    currentDebt = {},
    balancesCollateral = {},
    balancesDebt = {}
  }: Props = $props();

  const dispatch = createEventDispatcher<{ submit: { actions: CdpAction[] } }>();

  // Row-based builder
  type Row = { id: string; type: ActionType; asset: string; amountStr: string };
  let invalid = $state<string | null>(null);
  let rows = $state<Row[]>([]);

  const collatSet = $derived(new Set(collateralAssets.map((a) => a.symbol)));
  const debtSet = $derived(new Set(debtAssets.map((a) => a.symbol)));
  const byAsset = $derived(() => {
    const map = new Map<string, Asset>();
    for (const a of [...collateralAssets, ...debtAssets]) map.set(a.symbol, a);
    return map;
  });

  // UI: add action dropdown state
  let addMenuOpen = $state(false);
  function chooseAdd(t: ActionType) {
    addRow(t);
    addMenuOpen = false;
  }

  function parseAmount(s: string): number {
    const n = Number.parseFloat(s.replace(/[,\s]/g, ''));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  // Derived actions from rows
  const actions = $derived(
    rows.map((r) => ({ id: r.id, type: r.type, asset: r.asset, amount: parseAmount(r.amountStr) }))
  );

  function setRowAsset(id: string, asset: string) {
    rows = rows.map((r) => (r.id === id ? { ...r, asset } : r));
  }
  function setRowAmount(id: string, amountStr: string) {
    rows = rows.map((r) => (r.id === id ? { ...r, amountStr } : r));
  }
  function rowValid(r: Row): boolean {
    if (!r.asset) return false;
    const amt = parseAmount(r.amountStr);
    if (!amt) return false;
    if (r.type === 'remove_collateral') {
      const have = balancesCollateral[r.asset] ?? currentCollateral[r.asset] ?? 0;
      if (amt > have) return false;
    }
    if (r.type === 'repay') {
      const owe = balancesDebt[r.asset] ?? currentDebt[r.asset] ?? 0;
      if (amt > owe) return false;
    }
    if ((r.type === 'add_collateral' || r.type === 'remove_collateral') && !collatSet.has(r.asset)) return false;
    if ((r.type === 'borrow' || r.type === 'repay') && !debtSet.has(r.asset)) return false;
    return true;
  }
  const allValid = $derived(rows.length > 0 && rows.every(rowValid));
  const canSubmit = $derived(allValid);

  // Dedup by (type, asset)
  function dedup(list: CdpAction[]): CdpAction[] {
    const map = new Map<string, CdpAction>();
    for (const a of list) {
      if (!a || !a.asset || a.amount <= 0) continue;
      const key = `${a.type}:${a.asset}`;
      const prev = map.get(key);
      if (prev) prev.amount += a.amount;
      else map.set(key, { ...a });
    }
    return Array.from(map.values());
  }

  function addRow(type: ActionType) {
    invalid = null;
    // Asset starts empty; user must choose explicitly
    const defaultAsset = '';
    rows = [
      ...rows,
      { id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, type, asset: defaultAsset, amountStr: '' }
    ];
  }
  function removeRow(id: string) {
    rows = rows.filter((r) => r.id !== id);
  }
  function clearAll() { rows = []; }

  // Prefill on open
  $effect(() => {
    if (!open) return;
    invalid = null;
    // Initialize rows with one row; asset remains empty
    const initialType: ActionType = presetType ?? 'borrow';
    const initialAsset = presetAsset ?? '';
    const initialAmount = presetAmount !== undefined && presetAmount !== null ? String(presetAmount) : '';
    rows = [ { id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, type: initialType, asset: initialAsset, amountStr: initialAmount } ];
  });

  // Impact calculations
  function usd(asset: string, units: number): number {
    return (prices[asset] ?? 0) * units;
  }
  function totalCollateralUSD(state: Record<string, number>): number {
    let sum = 0;
    for (const [asset, units] of Object.entries(state)) sum += usd(asset, units);
    return sum;
  }
  function totalDebtUSD(state: Record<string, number>): number {
    let sum = 0;
    for (const [asset, units] of Object.entries(state)) sum += usd(asset, units);
    return sum;
  }
  function borrowPowerUSD(state: Record<string, number>): number {
    let sum = 0;
    for (const [asset, units] of Object.entries(state)) {
      if (!ltv[asset]) continue;
      sum += usd(asset, units) * (ltv[asset] ?? 0);
    }
    return sum;
  }
  function liqValueUSD(state: Record<string, number>): number {
    let sum = 0;
    for (const [asset, units] of Object.entries(state)) {
      const thr = liqThreshold[asset] ?? 0.8;
      sum += usd(asset, units) * thr;
    }
    return sum;
  }

  function applyActions() {
    const nextColl = { ...currentCollateral };
    const nextDebt = { ...currentDebt };
    for (const a of actions) {
      if (a.type === 'add_collateral') nextColl[a.asset] = (nextColl[a.asset] ?? 0) + a.amount;
      else if (a.type === 'remove_collateral') nextColl[a.asset] = Math.max(0, (nextColl[a.asset] ?? 0) - a.amount);
      else if (a.type === 'borrow') nextDebt[a.asset] = (nextDebt[a.asset] ?? 0) + a.amount;
      else if (a.type === 'repay') nextDebt[a.asset] = Math.max(0, (nextDebt[a.asset] ?? 0) - a.amount);
    }
    return { nextColl, nextDebt };
  }

  const before = $derived.by(() => {
    const collUSD = totalCollateralUSD(currentCollateral);
    const debtUSD = totalDebtUSD(currentDebt);
    const bpUSD = borrowPowerUSD(currentCollateral);
    const liqUSD = liqValueUSD(currentCollateral);
    const health = debtUSD > 0 ? liqUSD / debtUSD : 10;
    return { collUSD, debtUSD, bpUSD, liqUSD, health };
  });

  const after = $derived.by(() => {
    const { nextColl, nextDebt } = applyActions();
    const collUSD = totalCollateralUSD(nextColl);
    const debtUSD = totalDebtUSD(nextDebt);
    const bpUSD = borrowPowerUSD(nextColl);
    const liqUSD = liqValueUSD(nextColl);
    const health = debtUSD > 0 ? liqUSD / debtUSD : 10;
    return { collUSD, debtUSD, bpUSD, liqUSD, health };
  });

  function setPctForRow(row: Row, pct: number) {
    if (row.type === 'remove_collateral') {
      const have = balancesCollateral[row.asset] ?? currentCollateral[row.asset] ?? 0;
      setRowAmount(row.id, (have * pct).toString());
    } else if (row.type === 'repay') {
      const owe = balancesDebt[row.asset] ?? currentDebt[row.asset] ?? 0;
      setRowAmount(row.id, (owe * pct).toString());
    }
  }

  function submit() {
    invalid = null;
    if (!allValid) {
      invalid = 'Add at least one valid action and complete all fields.';
      return;
    }
    const finalActions = actions; // no dedup; keep user-entered rows as-is
    dispatch('submit', { actions: finalActions });
    open = false;
  }
</script>

<div class={`modal ${open ? 'modal-open' : ''}`} role="dialog" aria-modal={open}>
  <div class="modal-box max-w-4xl">
    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" onclick={() => (open = false)}>✕</button>
    <h3 class="font-semibold text-lg mb-2">Update CDP</h3>

    <div class="space-y-4">
      {#if invalid}
        <div role="alert" class="alert alert-warning py-2 text-sm">
          <span>{invalid}</span>
        </div>
      {/if}

      <div class="card bg-base-200/60">
        <div class="card-body p-3 sm:p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="card-title text-base">Actions</div>
            <div class="flex items-center gap-3">
              <div class="text-xs opacity-70">{rows.length} rows</div>
              <button class="btn btn-ghost btn-xs" onclick={clearAll} disabled={!rows.length}>Clear</button>
            </div>
          </div>

          <!-- Rows -->
          <div class="space-y-2">
            {#each rows as r (r.id)}
              <div class="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2">
                <div>
                  <div class="badge badge-ghost">
                    {r.type === 'add_collateral' ? 'Add Collateral' : r.type === 'remove_collateral' ? 'Remove' : r.type === 'borrow' ? 'Borrow' : 'Repay'}
                  </div>
                </div>
                <select
                  class="select select-bordered select-sm"
                  value={r.asset}
                  aria-label="Asset"
                  onchange={(e) => setRowAsset(r.id, (e.target as HTMLSelectElement).value)}
                >
                  <option value="">Select asset</option>
                  {#if r.type === 'add_collateral' || r.type === 'remove_collateral'}
                    {#each collateralAssets as a}
                      <option value={a.symbol}>{a.logo} {a.symbol}</option>
                    {/each}
                  {:else}
                    {#each debtAssets as a}
                      <option value={a.symbol}>{a.logo} {a.symbol}</option>
                    {/each}
                  {/if}
                </select>
                <div class="flex items-center gap-2">
                  <input
                    class="input input-bordered input-sm w-40"
                    type="text"
                    inputmode="decimal"
                    placeholder="Amount"
                    value={r.amountStr}
                    aria-label="Amount"
                    oninput={(e) => setRowAmount(r.id, (e.target as HTMLInputElement).value)}
                  />
                  {#if (r.type === 'remove_collateral' && (balancesCollateral[r.asset] ?? currentCollateral[r.asset])) || (r.type === 'repay' && (balancesDebt[r.asset] ?? currentDebt[r.asset]))}
                    <div class="join hidden sm:flex">
                      <button class="btn btn-xs join-item" onclick={() => setPctForRow(r, 0.25)}>25%</button>
                      <button class="btn btn-xs join-item" onclick={() => setPctForRow(r, 0.5)}>50%</button>
                      <button class="btn btn-xs join-item" onclick={() => setPctForRow(r, 1)}>MAX</button>
                    </div>
                  {/if}
                </div>
                <div class="text-right">
                  <button class="btn btn-ghost btn-xs" aria-label="Remove" onclick={() => removeRow(r.id)}>✕</button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Add action dropdown -->
          <div class="flex justify-center pt-1">
            <div class={`dropdown dropdown-top ${addMenuOpen ? 'dropdown-open' : ''}`}>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onclick={() => (addMenuOpen = !addMenuOpen)}
              >
                Add action
              </button>
              <ul class="dropdown-content menu bg-base-200 rounded-box z-[1] w-56 p-2 shadow">
                <li><button type="button" onclick={() => chooseAdd('add_collateral')}>Add Collateral</button></li>
                <li><button type="button" onclick={() => chooseAdd('remove_collateral')}>Remove Collateral</button></li>
                <li><button type="button" onclick={() => chooseAdd('borrow')}>Borrow</button></li>
                <li><button type="button" onclick={() => chooseAdd('repay')}>Repay</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Impact (bottom): Borrow Power and Health only -->
      <div class="card bg-base-200/60">
        <div class="card-body p-3 sm:p-4">
          <div class="card-title text-base">Impact</div>
          <div class="grid grid-cols-2 gap-3 mt-2">
            <div>
              <div class="text-xs opacity-70">Borrow Power</div>
              <div class="text-sm"><AmountDisplay amount={dec(before.bpUSD)} usd={dec(before.bpUSD)} /></div>
            </div>
            <div>
              <div class="text-xs opacity-70">Borrow Power</div>
              <div class="text-sm"><AmountDisplay amount={dec(after.bpUSD)}  usd={dec(after.bpUSD)} /></div>
            </div>
          </div>

          <div class="divider my-3"></div>

          <div class="flex items-center justify-between">
            <div class="text-xs opacity-70">Health</div>
            <div class="flex items-center gap-2">
              <HealthPill ratio={before.health} showValue={true} />
              <span>→</span>
              <HealthPill ratio={after.health} showValue={true} />
            </div>
          </div>
          <div class="flex justify-end mt-3">
            <button class="btn btn-primary btn-sm" onclick={submit} disabled={!canSubmit}>Review & Submit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop" onclick={() => (open = false)} onkeydown={(e) => e.key === 'Escape' && (open = false)} role="button" tabindex="0"></div>
</div>
