<script lang='ts'>
</script>

<div class='connect-btn'>
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <radix-connect-button />
</div>

<style>
.connect-btn {
display: flex;
justify-content: center;
align-items: center;
--radix-connect-button-width: 9rem;
--radix-connect-button-height: 2rem;
--radix-connect-button-border-radius: 0.2rem;
}
@media (max-width: 384px) {
.connect-btn {
--radix-connect-button-width: 100px;
}
}
</style>
