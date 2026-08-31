import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Pages are prerendered by default; the blog and /admin opt out with
// `export const prerender = false` so they read from the database per request.
export default defineConfig({
  adapter: vercel(),
});
