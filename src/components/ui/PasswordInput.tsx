"use client";
import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useL } from "@/lib/i18n/context";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { tone?: "light" | "dark" };

/** Champ mot de passe avec petit œil pour afficher / masquer ce qu'on tape. */
export default function PasswordInput({ tone = "light", style, ...props }: Props) {
  const l = useL();
  const [shown, setShown] = useState(false);
  const label = shown ? l("Masquer le mot de passe", "Wachtwoord verbergen") : l("Afficher le mot de passe", "Wachtwoord tonen");
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} style={{ ...style, paddingRight: 44 }} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={label}
        title={label}
        aria-pressed={shown}
        className={`absolute right-1 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition ${tone === "dark" ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
