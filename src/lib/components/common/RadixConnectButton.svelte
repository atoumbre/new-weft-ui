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
		--radix-connect-button-width: 8.25rem;
		--radix-connect-button-height: 1.875rem;
		--radix-connect-button-border-radius: 0.5rem;
	}
	@media (max-width: 384px) {
		.connect-btn {
			--radix-connect-button-width: 100px;
		}
	}
</style>
