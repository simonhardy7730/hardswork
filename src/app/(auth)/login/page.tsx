"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: "error", text: "Email ou mot de passe incorrect." });
      } else {
        router.push("/dashboard");
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

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-1">
          Bon retour 👋
        </h1>
        <p className="text-[#64748B] text-sm mb-6">
          Connectez-vous à votre espace Rekruut
        </p>

        {/* Tabs mode */}
        <div className="flex bg-[#F1F5F9] rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode("password")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
              mode === "password"
                ? "bg-white text-[#1E293B] shadow-sm"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            Mot de passe
          </button>
          <button
            onClick={() => setMode("magic")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
              mode === "magic"
                ? "bg-white text-[#1E293B] shadow-sm"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            Lien magique
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
              Adresse email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.be"
                className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
              />
            </div>
          </div>

          {/* Mot de passe */}
          {mode === "password" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1E293B]">
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#1E40AF] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`text-sm px-4 py-3 rounded-lg ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E40AF] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "password" ? "Se connecter" : "Recevoir le lien"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="text-[#1E40AF] font-medium hover:underline"
          >
            Démarrer gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
