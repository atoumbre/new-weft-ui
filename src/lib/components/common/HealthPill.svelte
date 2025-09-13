<script lang="ts">
  type Props = { ratio?: number; showValue?: boolean };
  let { ratio = 0, showValue = false }: Props = $props();
  const { color, label } = $derived.by(() => {
    if (ratio >= 2.0) return { color: 'badge-success', label: 'Safe' };
    if (ratio >= 1.5) return { color: 'badge-warning', label: 'Moderate' };
    return { color: 'badge-error', label: 'At Risk' };
  });
</script>

<div class={`badge ${color} gap-1`}>{label}{showValue ? ` · ${ratio.toFixed(2)}` : ''}</div>

