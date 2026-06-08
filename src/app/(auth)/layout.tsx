import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F0E0D] flex flex-col">
      {/* Header */}
      <header className="py-5 px-6 border-b border-white/[0.06]">
        <Link href="/" className="w-fit block">
          <HardSworkLogo size="md" dark />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-white/20 border-t border-white/[0.06]">
        © 2025 HardSwork · Belgique · Tous droits réservés
      </footer>
    </div>
  );
}
