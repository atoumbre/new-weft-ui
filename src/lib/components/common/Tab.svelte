<script lang="ts">
  type Props = { id: string; label?: string; activeId: string; icon?: any };
  let { id, label = '', activeId = $bindable<string>(), icon }: Props = $props();
  function select() {
    activeId = id;
  }
</script>

<button
  role="tab"
  class="tab flex items-center gap-2"
  class:tab-active={activeId === id}
  onclick={select}
>
  {@render icon?.()}
  <span>{label}</span>
</button>
