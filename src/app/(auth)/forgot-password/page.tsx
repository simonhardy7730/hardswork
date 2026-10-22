"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import Turnstile, { useCaptcha } from "@/components/security/Turnstile";

export default function ForgotPasswordPage() {
  const l = useL();
  const captcha = useCaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      captchaToken: captcha.token || undefined,
    });
    captcha.reset();

    if (err) {
      setError(l("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.", "De e-mail kon niet worden verstuurd. Controleer het ingevoerde adres."));
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  const inputClass =
    "w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";
  const labelClass =
    "block text-[13px] font-semibold text-white/60 mb-1.5 uppercase tracking-wide";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1
          className="font-display font-black text-white mb-2"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1 }}
        >
          {l("Mot de passe oublié.", "Wachtwoord vergeten.")}
        </h1>
        <p className="text-white/40 text-sm">
          {l("Recevez un lien de réinitialisation par email.", "Ontvang een link om je wachtwoord opnieuw in te stellen.")}
        </p>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7">
        {sent ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <p className="text-white font-semibold">{l("Email envoyé !", "E-mail verstuurd!")}</p>
            <p className="text-white/40 text-sm leading-relaxed">
              {l("Consultez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.", "Controleer je mailbox en klik op de link om je wachtwoord opnieuw in te stellen.")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-brand hover:text-brand-light text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              {l("Retour à la connexion", "Terug naar inloggen")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>{l("Adresse email", "E-mailadres")}</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={l("vous@exemple.be", "jij@voorbeeld.be")}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <Turnstile onToken={captcha.setToken} resetKey={captcha.resetKey} />

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full justify-center mt-2 disabled:opacity-60"
              style={{ padding: "0.875rem", fontSize: "0.9375rem" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                l("Envoyer le lien", "Link versturen")
              )}
            </button>

            <p className="text-center text-sm text-white/30 mt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
              >
                <ArrowLeft size={13} />
                {l("Retour à la connexion", "Terug naar inloggen")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
