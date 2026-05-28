import { createBrowserClient } from "@supabase/ssr";

// Note: Le générique Database est omis volontairement pour éviter un conflit
// de types avec @supabase/ssr. Les types sont gérés via les helpers typés
// dans src/lib/supabase/helpers.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
