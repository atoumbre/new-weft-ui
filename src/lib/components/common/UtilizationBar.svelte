<script lang="ts">
  export let value: number = 0; // 0..100
</script>

<div class="space-y-1" aria-label={`Utilization ${value}%`}>
  <div class="flex items-center justify-between text-xs opacity-70"><span class="tabular-nums">{value}%</span></div>
  <progress class="progress progress-primary h-2" max="100" value={value}></progress>
</div>
