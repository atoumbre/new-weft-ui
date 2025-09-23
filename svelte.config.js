import adapter from '@sveltejs/adapter-cloudflare'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      '$lib': 'src/lib',
      '$lib/*': 'src/lib/*',
    },
    prerender: {
      handleMissingId: 'warn',
      handleUnseenRoutes: 'ignore',
    },
  },

  // compilerOptions: {
  //   experimental: {
  //     async: true, // Enable experimental async features
  //   },
  // },
}

export default config
