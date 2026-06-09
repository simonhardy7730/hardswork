"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";

export default function LoginPage() {
  const router = useRouter();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: "error", text: "Email ou mot de passe incorrect." });
      } else {
        const userType = data.user?.user_metadata?.user_type;
        if (userType === "candidate") {
          router.push("/candidat/dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage({
          type: "error",
          text: "Impossible d'envoyer le lien. Réessayez.",
        });
      } else {
        setMessage({
          type: "success",
          text: "✅ Lien envoyé ! Vérifiez votre boîte mail.",
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
          Bon retour.
        </h1>
        <p className="text-white/40 text-sm">Connectez-vous à votre espace HardSwork</p>
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
              {m === "password" ? "Mot de passe" : "Lien magique"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className={labelClass}>Adresse email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.be"
                className={inputClass} />
            </div>
          </div>

          {/* Mot de passe */}
          {mode === "password" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Mot de passe</label>
                <Link href="/forgot-password" className="text-[11px] text-brand hover:text-brand-light transition-colors">
                  Mot de passe oublié ?
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

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-brand w-full justify-center mt-2 disabled:opacity-60"
            style={{ padding: "0.875rem", fontSize: "0.9375rem" }}>
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <>{mode === "password" ? "Se connecter" : "Recevoir le lien"} <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-3 text-[11px] text-white/25 uppercase tracking-widest">
              ou
            </span>
          </div>
        </div>

        <GoogleButton redirectTo="/dashboard" />

        <p className="text-center text-sm text-white/30 mt-5">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-brand hover:text-brand-light font-semibold transition-colors">
            Démarrer gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
