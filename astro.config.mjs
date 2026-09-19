// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://chook-games.github.io',
  base: '/RitaSamothrakiMesitiko',
  i18n: {
    defaultLocale: 'el',
    locales: ['el', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  },
  devToolbar: {
    enabled: false
  }
});
