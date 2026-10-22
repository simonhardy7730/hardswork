"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useL } from "@/lib/i18n/context";
import PasswordInput from "@/components/ui/PasswordInput";

// Arrivée depuis le lien « mot de passe oublié » : /auth/callback a déjà ouvert la session de récupération.
export default function ResetPasswordPage() {
  const l = useL();
  const router = useRouter();
  const [ready, setReady] = useState<"loading" | "ok" | "expired">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setReady(data.user ? "ok" : "expired"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(l("Choisis un mot de passe d'au moins 8 caractères.", "Kies een wachtwoord van minstens 8 tekens.")); return; }
    if (password !== confirm) { setError(l("Les deux mots de passe ne sont pas identiques.", "De twee wachtwoorden zijn niet gelijk.")); return; }
    setLoading(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (err) {
      const m = err.message.toLowerCase();
      setError(m.includes("different") || m.includes("same")
        ? l("Choisis un mot de passe différent de l'ancien.", "Kies een ander wachtwoord dan het vorige.")
        : l("Impossible de changer le mot de passe. Demande un nouveau lien et réessaie.", "Het wachtwoord kon niet worden gewijzigd. Vraag een nieuwe link aan en probeer opnieuw."));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/auth/redirect"), 1200);
  }

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";
  const labelClass = "block text-[13px] font-semibold text-white/60 mb-1.5 uppercase tracking-wide";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-display font-black text-white mb-2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1 }}>
          {l("Nouveau mot de passe.", "Nieuw wachtwoord.")}
        </h1>
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7">
        {ready === "loading" ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-white/50" /></div>
        ) : ready === "expired" ? (
          <div className="text-center space-y-4 py-2">
            <p className="text-white/70 text-sm leading-relaxed">
              {l("Ce lien n'est plus valable (il a peut-être expiré ou déjà servi). Demande un nouveau lien.", "Deze link is niet meer geldig (mogelijk verlopen of al gebruikt). Vraag een nieuwe link aan.")}
            </p>
            <Link href="/forgot-password" className="btn-brand inline-flex justify-center">{l("Recevoir un nouveau lien", "Nieuwe link ontvangen")}</Link>
          </div>
        ) : done ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <p className="text-white font-semibold">{l("Mot de passe modifié !", "Wachtwoord gewijzigd!")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}><Lock size={12} className="inline -mt-0.5 mr-1" />{l("Nouveau mot de passe", "Nieuw wachtwoord")}</label>
              <PasswordInput tone="dark" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={l("Minimum 8 caractères", "Minimum 8 tekens")} className={inputClass} autoComplete="new-password" />
            </div>
            <div>
              <label className={labelClass}>{l("Confirme le mot de passe", "Bevestig het wachtwoord")}</label>
              <PasswordInput tone="dark" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" className={inputClass} autoComplete="new-password" />
            </div>
            {error && <div className="text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}
            <button type="submit" disabled={loading} className="btn-brand w-full justify-center mt-2 disabled:opacity-60" style={{ padding: "0.875rem", fontSize: "0.9375rem" }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : l("Enregistrer", "Opslaan")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
