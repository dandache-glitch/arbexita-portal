"use client";

import React from "react";
import { useCompany } from "@/app/providers/CompanyProvider";
import { INDUSTRIES } from "@/lib/industries";

export default function DocumentsPage() {
  const { isLoading, company } = useCompany();

  const pack = INDUSTRIES.find((x) => x.key === (company?.industry ?? "kontor")) || INDUSTRIES[0];

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Dokument</h1>
          <p>Branschspecifika mallar och checklistor för Systematiskt Arbetsmiljöarbete (SAM).</p>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="muted">Laddar…</div>
        ) : !company ? (
          <div className="muted">Inget företag hittades för kontot.</div>
        ) : (
          <>
            <div className="notice">
              <div className="noticeTitle">Bransch: {pack.label}</div>
              <div className="noticeText">
                Innehållet nedan är anpassat efter vald bransch. Du kan senare lägga till fler dokumentpaket.
              </div>
            </div>

            <div className="docsGrid">
              {pack.items.map((doc) => (
                <a key={doc.href} className="docCard" href={doc.href}>
                  <div className="docTitle">{doc.title}</div>
                  <div className="docDesc">{doc.description}</div>
                  <div className="docMeta">Öppna</div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
