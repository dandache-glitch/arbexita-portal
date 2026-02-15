"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { useCompany } from "@/app/providers/CompanyProvider";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/app" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className="btn"
      style={{
        justifyContent: "flex-start",
        width: "100%",
        background: active ? "rgba(59,130,246,0.18)" : undefined,
        borderColor: active ? "rgba(59,130,246,0.30)" : undefined
      }}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const company = useCompany();

  async function logout() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    router.replace("/login");
  }

  return (
    <div className="row">
      <aside className="sidebar">
        <div className="card" style={{ padding: 14 }}>
          <div className="topbar">
            <div className="brand">
              <Logo variant="full" />
            </div>
            <button className="btn btn-danger" onClick={logout} disabled={busy}>
              {busy ? "..." : "Logga ut"}
            </button>
          </div>

          <div className="notice" style={{ margin: "0 16px 12px" }}>
            <div style={{ fontWeight: 800 }}>{company.companyName}</div>
            <div className="small">Organisationsvy • {company.industry}</div>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <NavItem href="/app" label="Dashboard" />
            <NavItem href="/app/compliance" label="Redo för inspektion" />
            <NavItem href="/app/riskbedomningar" label="Riskbedömningar" />
            <NavItem href="/app/atgarder" label="Åtgärder" />
            <NavItem href="/app/incidenter" label="Incidenter" />
            <NavItem href="/app/policy" label="Policy (PDF)" />
            <NavItem href="/app/export" label="Inspektionspaket" />
            <NavItem href="/app/dokument" label="Branschdokument" />
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 12 }}>
          <div className="small">
            Tips: Målet är <b>100%</b>. Varje punkt du gör klar höjer din compliance-score.
          </div>
        </div>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}
