/**
 * Petit cache mémoire avec durée de vie : on ne paie pas deux fois la même analyse
 * ou la même recherche de prix. En production sur Vercel, chaque instance a sa propre
 * mémoire : l'étape suivante est un cache partagé (Vercel KV / Upstash Redis), voir PLAN.md.
 */
export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries = 500,
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Remet l'entrée en fin de file (la plus récemment utilisée)
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V) {
    this.store.delete(key);
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
    while (this.store.size > this.maxEntries) {
      this.store.delete(this.store.keys().next().value as string);
    }
  }
}

/** Empreinte SHA-256 (hexadécimale) d'un texte, pour servir de clé de cache. */
export async function fingerprint(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
