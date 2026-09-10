/**
 * Reads a POST body as a plain object, accepting either a normal form
 * submission or JSON. The admin UI posts JSON because *.vercel.app rejects
 * form-encoded POSTs ("Cross-site POST form submissions are forbidden");
 * form parsing stays supported so the pages still work without JavaScript
 * on a custom domain.
 */
export async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') || '';

  if (type.includes('application/json')) {
    const json = await request.json().catch(() => ({}));
    return Object.fromEntries(
      Object.entries(json as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)]),
    );
  }

  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}
