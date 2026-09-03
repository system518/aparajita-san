import type { APIRoute } from 'astro';
import { listPosts } from '../lib/db';

export const prerender = false;

const STATIC_PATHS = [
  '',
  'aagekaun',
  'akaar',
  'aparajita-institution',
  'archives',
  'awards-2026',
  'blog',
  'contact-us',
  'footprints',
  'jury-awardees',
  'movement',
  'ourpartners',
  'overview',
  'popular-awardees',
  'process',
];

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? 'https://aparajita.sanmarg.in';

  const staticEntries = STATIC_PATHS.map(
    (path) => `  <url>
    <loc>${base}/${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.7'}</priority>
  </url>`
  );

  let postEntries: string[] = [];
  try {
    const posts = await listPosts();
    postEntries = posts.map(
      (post) => `  <url>
    <loc>${base}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    );
  } catch {
    // DB unreachable at build/edge time — ship the static URLs rather than fail the sitemap.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...postEntries].join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
