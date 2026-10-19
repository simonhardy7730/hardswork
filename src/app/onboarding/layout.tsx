import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { getL } from "@/lib/i18n/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const l = await getL();
  return (
    <div className="min-h-screen bg-[#101F43] flex flex-col">
      <header className="py-4 px-6 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/"><HardSworkLogo size="sm" dark /></Link>
        <div className="flex items-center gap-4">
          <LangSwitch />
          <span className="text-xs text-white/50 font-medium hidden sm:block">{l("Configuration initiale", "Eerste instelling")}</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
