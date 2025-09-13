<script>
  import '../app.css';
  let address = '0x1234...5678';
</script>

<div data-theme="cryptolend" class="min-h-screen bg-base-100 text-base-content">
  <header class="border-b border-base-200 bg-base-200/20 backdrop-blur">
    <div class="container mx-auto px-6 py-2">
      <div class="navbar p-0 min-h-0">
        <div class="flex-1">
          <a href="/" class="flex items-center gap-2 no-underline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 text-primary"><path d="M12 2l7 4v6c0 5-3.5 9.74-7 10-3.5-.26-7-5-7-10V6l7-4z"/></svg>
            <h1 class="text-2xl font-semibold">CryptoLend</h1>
            <div class="badge badge-outline badge-sm ml-2">Beta</div>
          </a>
        </div>
        <div class="flex-none gap-4">
          <div class="flex items-center gap-2 px-4 py-2 border rounded-lg bg-base-100 border-base-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 opacity-70"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 10V7a5 5 0 0110 0v3m-9 8h8a2 2 0 002-2v-6H5v6a2 2 0 002 2z"/></svg>
            <span class="text-sm">{address}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 bg-green-500 rounded-full"></div>
            <span class="text-sm opacity-70">Connected</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="container mx-auto px-6 py-6">
    <slot />
  </main>
</div>
