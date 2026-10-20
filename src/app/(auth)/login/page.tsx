"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import Turnstile, { useCaptcha } from "@/components/security/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const l = useL();
  const captcha = useCaptcha();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captcha.token || undefined },
      });
      captcha.reset();
      if (error) {
        setMessage({ type: "error", text: l("Email ou mot de passe incorrect.", "Onjuist e-mailadres of wachtwoord.") });
      } else {
        // L'espace (candidat / entreprise / agence) est déterminé côté serveur.
        const next = new URLSearchParams(window.location.search).get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/auth/redirect";
        router.push(safeNext);
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken: captcha.token || undefined,
        },
      });
      captcha.reset();
      if (error) {
        setMessage({
          type: "error",
          text: l("Impossible d'envoyer le lien. Réessayez.", "De link kon niet worden verstuurd. Probeer opnieuw."),
        });
      } else {
        setMessage({
          type: "success",
          text: l("✅ Lien envoyé ! Vérifiez votre boîte mail.", "✅ Link verstuurd! Controleer je mailbox."),
        });
      }
    }

    setLoading(false);
  }

  const inputClass = "w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";
  const labelClass = "block text-[13px] font-semibold text-white/60 mb-1.5 uppercase tracking-wide";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-display font-black text-white mb-2"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1 }}>
          {l("Bon retour.", "Welkom terug.")}
        </h1>
        <p className="text-white/40 text-sm">{l("Connectez-vous à votre espace Wolko", "Log in op je Wolko-ruimte")}</p>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7">
        {/* Tabs mode */}
        <div className="flex bg-white/[0.05] rounded-xl p-1 mb-6">
          {(["password", "magic"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 text-[13px] py-2 rounded-lg font-semibold transition-all ${
                mode === m
                  ? "bg-white text-ink shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}>
              {m === "password" ? l("Mot de passe", "Wachtwoord") : l("Lien magique", "Magische link")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className={labelClass}>{l("Adresse email", "E-mailadres")}</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={l("vous@exemple.be", "jij@voorbeeld.be")}
                className={inputClass} />
            </div>
          </div>

          {/* Mot de passe */}
          {mode === "password" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>{l("Mot de passe", "Wachtwoord")}</label>
                <Link href="/forgot-password" className="text-[11px] text-brand hover:text-brand-light transition-colors">
                  {l("Mot de passe oublié ?", "Wachtwoord vergeten?")}
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass} />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl ${
              message.type === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {message.text}
            </div>
          )}

          <Turnstile onToken={captcha.setToken} resetKey={captcha.resetKey} />

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-brand w-full justify-center mt-2 disabled:opacity-60"
            style={{ padding: "0.875rem", fontSize: "0.9375rem" }}>
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <>{mode === "password" ? l("Se connecter", "Inloggen") : l("Recevoir le lien", "Link ontvangen")} <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-5">
          {l("Pas encore de compte ?", "Nog geen account?")}{" "}
          <Link href="/signup" className="text-brand hover:text-brand-light font-semibold transition-colors">
            {l("Démarrer mes 7 jours d'essai", "Mijn 7 proefdagen starten")}
          </Link>
        </p>
      </div>
    </div>
  );
}
