import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the app icons in public/ from public/favicon.svg. Run `npm run icons` after changing the logo.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#16245e' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#16245e' } },
  },
  images: ['public/favicon.svg'],
})
