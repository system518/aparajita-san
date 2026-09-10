// Vite requires static `import.meta.env.X` access, so each variable is read by
// name; process.env is the fallback for plain node (scripts, custom server).
export const TURSO_DATABASE_URL = import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
export const TURSO_AUTH_TOKEN = import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
export const SESSION_SECRET = import.meta.env.SESSION_SECRET ?? process.env.SESSION_SECRET ?? '';
export const IS_PROD = import.meta.env.PROD ?? process.env.NODE_ENV === 'production';
