<script lang="ts">
  export let value: number = 0; // 0..100
</script>

<div class="space-y-1">
  <div class="flex items-center justify-between text-sm"><span>{value}%</span></div>
  <progress class="progress progress-primary h-2" max="100" value={value}></progress>
</div>
