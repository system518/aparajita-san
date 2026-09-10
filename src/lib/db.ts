import { createClient } from '@libsql/client';
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from './env';

const url = TURSO_DATABASE_URL;
const authToken = TURSO_AUTH_TOKEN;
if (!url) throw new Error('TURSO_DATABASE_URL is not set — see BLOG-CMS.md');

export const db = createClient({ url, authToken });

/** Tagged-template helper so call sites read like plain SQL with bound args. */
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const result = await db.execute({
    sql: strings.raw.join('?'),
    args: values.map((v) => (v === undefined ? null : v)),
  });
  return result.rows as any[];
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  author: string;
  cover: string | null;
  body: string;
  published: number; // SQLite has no boolean: 0 / 1
  published_at: string | null;
  updated_at: string;
}

export async function listPosts({ publishedOnly = true } = {}): Promise<Post[]> {
  return (publishedOnly
    ? await sql`SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC`
    : await sql`SELECT * FROM posts ORDER BY updated_at DESC`) as Post[];
}

export async function getPostBySlug(slug: string, { publishedOnly = true } = {}): Promise<Post | null> {
  const rows = publishedOnly
    ? await sql`SELECT * FROM posts WHERE slug = ${slug} AND published = 1 LIMIT 1`
    : await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`;
  return (rows[0] as Post) ?? null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const rows = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
  return (rows[0] as Post) ?? null;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}
