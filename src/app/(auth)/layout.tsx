import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="py-5 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 bg-[#1E40AF] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-lg font-bold text-[#1E293B]">Rekruut</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#94A3B8]">
        30 jours d&apos;essai gratuit · Sans carte bancaire
      </footer>
    </div>
  );
}
