import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F0E0D] flex flex-col">
      <header className="py-4 px-6 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/"><HardSworkLogo size="sm" dark /></Link>
        <span className="text-xs text-white/30 font-medium">Configuration initiale</span>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
