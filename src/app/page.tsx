import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg" />
          <span className="text-2xl font-bold text-[#1E293B]">Rekruut</span>
        </div>
        <h1 className="text-4xl font-bold text-[#1E293B] max-w-md">
          Le recrutement ouvrier,{" "}
          <span className="text-[#1E40AF]">enfin pensé pour la Belgique</span>
        </h1>
        <p className="text-[#64748B] max-w-sm mx-auto">
          Diffusez vos offres, gérez vos candidats, recrutez plus vite — sans
          payer Indeed au prix fort.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link
            href="/signup"
            className="bg-[#1E40AF] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Démarrer gratuitement 30 jours
          </Link>
          <Link
            href="/login"
            className="border border-[#E2E8F0] text-[#1E293B] px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Se connecter
          </Link>
        </div>
        <p className="text-xs text-[#64748B] pt-8">
          ✅ Étape 1 terminée — Setup Next.js + Supabase + shadcn/ui
        </p>
      </div>
    </main>
  );
}
