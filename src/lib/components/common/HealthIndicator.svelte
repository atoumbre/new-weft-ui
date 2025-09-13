<script lang="ts">
  type Props = { ratio?: number };
  let { ratio = 0 }: Props = $props();
  const color = $derived(ratio >= 2.0 ? 'text-success' : ratio >= 1.5 ? 'text-warning' : 'text-error');
</script>

<span class={color}>{Number(ratio).toFixed(2)}</span>
