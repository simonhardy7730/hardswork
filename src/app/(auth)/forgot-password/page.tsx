"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
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
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (err) {
      setError("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.");
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
          Mot de passe oublié.
        </h1>
        <p className="text-white/40 text-sm">
          Recevez un lien de réinitialisation par email.
        </p>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7">
        {sent ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <p className="text-white font-semibold">Email envoyé !</p>
            <p className="text-white/40 text-sm leading-relaxed">
              Consultez votre boîte mail et cliquez sur le lien pour
              réinitialiser votre mot de passe.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-brand hover:text-brand-light text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Adresse email</label>
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
                  placeholder="vous@exemple.be"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full justify-center mt-2 disabled:opacity-60"
              style={{ padding: "0.875rem", fontSize: "0.9375rem" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Envoyer le lien"
              )}
            </button>

            <p className="text-center text-sm text-white/30 mt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
              >
                <ArrowLeft size={13} />
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
