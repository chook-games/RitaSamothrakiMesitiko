// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// When deploying to GitHub Pages we need the repository base path.
// GitHub Actions sets GITHUB_ACTIONS=true automatically; Cloudflare Pages does not,
// so on Cloudflare (or any root domain) base = '/'.
const isGhPages = process.env.GITHUB_ACTIONS === 'true' || process.env.DEPLOY_TARGET === 'ghpages';
const site = process.env.PUBLIC_SITE_URL || 'https://chook-games.github.io';

// https://astro.build/config
export default defineConfig({
  site,
  base: isGhPages ? '/RitaSamothrakiMesitiko' : '/',
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
