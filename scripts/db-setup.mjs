// One-time setup: creates the tables and the first admin user.
//   npm run db:setup -- "you@example.com" "a-strong-password" "Your Name"
import { createClient } from '@libsql/client';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';

function fromEnvFile(key) {
  try {
    return readFileSync('.env', 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.replace(/["']/g, '').trim();
  } catch {
    return undefined;
  }
}

const url = process.env.TURSO_DATABASE_URL || fromEnvFile('TURSO_DATABASE_URL');
const authToken = process.env.TURSO_AUTH_TOKEN || fromEnvFile('TURSO_AUTH_TOKEN');
if (!url) {
  console.error('TURSO_DATABASE_URL is not set. Run `npx vercel env pull .env` first.');
  process.exit(1);
}

const [email, password, name = 'Editor'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run db:setup -- "you@example.com" "password" "Your Name"');
  process.exit(1);
}

const db = createClient({ url, authToken });

await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    email         TEXT PRIMARY KEY,
    name          TEXT NOT NULL DEFAULT 'Editor',
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT UNIQUE NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    author       TEXT NOT NULL DEFAULT 'Aparajita',
    cover        TEXT,
    body         TEXT NOT NULL DEFAULT '',
    published    INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

await db.execute(`CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published, published_at DESC)`);

const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

await db.execute({
  sql: `INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)
        ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`,
  args: [email.toLowerCase(), name, hash],
});

console.log(`Tables ready. ${email} can now sign in at /admin/login`);
