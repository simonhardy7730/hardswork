import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/admin/platform";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration WOLKO", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) notFound(); // ne révèle pas l'existence de l'espace d'administration
  return (
    <div className="min-h-screen bg-[#FFFBF2]">
      <header className="bg-[#101F43] text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/admin/flash" className="font-black tracking-tight"><span className="text-[#FFB900]">WOL</span>KO <span className="text-white/60 font-normal text-sm">· Administration</span></Link>
        <nav className="flex items-center gap-4 text-sm"><Link href="/admin/stats" className="font-bold hover:text-[#FFB900]">Statistiques</Link><Link href="/admin/flash" className="font-bold hover:text-[#FFB900]">Flash</Link><span className="hidden sm:inline text-xs text-white/70">{admin.email} · {admin.role}</span></nav>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
