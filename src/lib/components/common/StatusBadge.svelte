<script lang='ts'>
  type Props = { status?: 'healthy' | 'warning' | 'error' | string }
  const { status = 'healthy' }: Props = $props()
  const klass = $derived(
    status === 'healthy' ? 'badge-success' : status === 'warning' ? 'badge-warning' : 'badge-error',
  )
</script>

<div class={`badge ${klass}`}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
</div>
