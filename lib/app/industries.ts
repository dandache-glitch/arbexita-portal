export type IndustryKey = "kontor" | "bygg" | "restaurang" | "lager" | "vard";

export type IndustryPack = {
  key: IndustryKey;
  name: string;
  description: string;
  docs: { slug: string; title: string; description: string }[];
};

export const INDUSTRIES: IndustryPack[] = [
  { key: "kontor", name: "Kontor", description: "Ergonomi, belastning, psykosocial arbetsmiljö, brandskydd.",
    docs: [
      { slug: "ergonomi", title: "Ergonomichecklista", description: "Stol/bord, skärm, belysning, pauser." },
      { slug: "psyko", title: "Psykosocial inventering", description: "Arbetsbelastning, kränkande särbehandling, stress." }
    ]
  },
  { key: "bygg", name: "Bygg", description: "Fallrisk, maskiner, kemiska risker, ordning och reda.",
    docs: [
      { slug: "fallrisk", title: "Fallrisk-checklista", description: "Ställning, stegar, skyddsräcken, PPE." },
      { slug: "maskin", title: "Maskin- & verktygskontroll", description: "Elverktyg, skydd, underhåll, instruktioner." }
    ]
  },
  { key: "restaurang", name: "Restaurang", description: "Halkrisk, heta ytor, knivar, stress, hygienrutiner.",
    docs: [
      { slug: "halk", title: "Halk- & brännskaderisk", description: "Golv, skor, heta ytor, spillrutiner." },
      { slug: "kniv", title: "Knivsäkerhet", description: "Skärskydd, rutiner, utbildning." }
    ]
  },
  { key: "lager", name: "Lager/Logistik", description: "Truckar, lyft, plock, trafikytor, belastning.",
    docs: [
      { slug: "truck", title: "Truck- & trafikchecklista", description: "Zoner, utbildning, hastighet, underhåll." },
      { slug: "lyft", title: "Lyft & belastning", description: "Hjälpmedel, maxvikter, rotation." }
    ]
  },
  { key: "vard", name: "Vård/Omsorg", description: "Hot/våld, smitta, ergonomi, stress, sekretess.",
    docs: [
      { slug: "hot", title: "Hot & våld – rutiner", description: "Riskbedömning, larm, bemanning, uppföljning." },
      { slug: "smitta", title: "Smittskydd & hygien", description: "PPE, rutiner, avvikelser." }
    ]
  }
];

export type ComplianceStep = {
  key: string;
  title: string;
  why: string;
  lawHint: string;
};

export const COMPLIANCE_STEPS: ComplianceStep[] = [
  {
    key: "policy",
    title: "Arbetsmiljöpolicy på plats",
    why: "En tydlig policy visar att ni arbetar systematiskt och har mål och inriktning.",
    lawHint: "SAM: policy + mål (AFS 2001:1)"
  },
  {
    key: "risk",
    title: "Minst 1 aktuell riskbedömning",
    why: "Ni ska undersöka och bedöma risker, särskilt vid förändringar.",
    lawHint: "Undersöka/bedöma risker (AFS 2001:1)"
  },
  {
    key: "actions",
    title: "Inga förfallna åtgärder",
    why: "Åtgärder ska ha ansvarig och tidsplan – annars blir riskerna kvar.",
    lawHint: "Åtgärda och följa upp (AFS 2001:1)"
  },
  {
    key: "incidents",
    title: "Rutiner för tillbud/olyckor och uppföljning",
    why: "Tillbud är tidiga varningssignaler. Följ upp och förebygg.",
    lawHint: "Rutiner + uppföljning (AFS 2001:1)"
  },
  {
    key: "annual",
    title: "Årlig uppföljning dokumenterad",
    why: "SAM ska följas upp minst årligen och vid behov oftare.",
    lawHint: "Årlig uppföljning (AFS 2001:1)"
  }
];
