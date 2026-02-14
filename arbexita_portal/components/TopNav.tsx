"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/riskbedomningar", label: "Riskbedömningar" },
  { href: "/app/atgarder", label: "Åtgärder" },
  { href: "/app/incidenter", label: "Incidenter" },
  { href: "/app/dokument", label: "Dokument" }
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/app" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">A</span>
          Arbexita
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          {tabs.map(t => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "rounded-lg px-3 py-2 text-sm border " +
                  (active ? "bg-blue-50 border-blue-200 text-blue-800" : "border-transparent hover:border-slate-200")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="text-sm">
          <span className="badge badge-green mr-2">499 kr/mån</span>
          <Link className="btn" href="/logout">Logga ut</Link>
        </div>
      </div>
    </div>
  );
}
