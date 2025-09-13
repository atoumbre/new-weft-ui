/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        cryptolend: {
          primary: '#2563eb',
          secondary: '#7c3aed',
          accent: '#22c55e',
          neutral: '#1f2937',
          'base-100': '#0b1220',
          info: '#38bdf8',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      },
      'dark',
      'light'
    ]
  }
};

