import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8] font-sans antialiased">
      <header className="border-b border-[#1e1e24] px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          {LEGAL.product}
        </Link>
        <Link href="/" className="text-sm text-[#a1a1aa] hover:text-white">
          ← Back to dashboard
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#71717a]">Effective {LEGAL.effectiveDate}</p>
        <div className="legal mt-8 space-y-4 text-[15px] leading-relaxed">{children}</div>
      </main>
      <footer className="border-t border-[#1e1e24] px-4 sm:px-6 py-6 text-xs text-[#71717a] flex flex-wrap gap-4">
        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-white">Terms of Service</Link>
        <a href={`mailto:${LEGAL.contactEmail}`} className="hover:text-white">Contact</a>
      </footer>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-6 text-xl font-semibold text-white">{children}</h2>;
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>;
}
