export type IndustryKey =
  | "kontor"
  | "bygg"
  | "industri"
  | "butik"
  | "transport"
  | "vard"
  | "restaurang"
  | "skola"
  | "annan";

export type IndustryDoc = {
  title: string;
  description: string;
  href: string;
};

export type IndustryPack = {
  key: IndustryKey;
  label: string;
  items: IndustryDoc[];
};

/**
 * Branschpaket för dokument/checklistor.
 * Dessa länkar pekar på routes i appen. Du kan senare byta till Storage/PDF.
 */
export const INDUSTRIES: IndustryPack[] = [
  {
    key: "kontor",
    label: "Kontor",
    items: [
      {
        title: "SAM-checklista (grund)",
        description: "Översikt över vad som krävs för systematiskt arbetsmiljöarbete.",
        href: "/app/compliance",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Skapa och spara arbetsmiljöpolicy som PDF.",
        href: "/app/policy",
      },
      {
        title: "Riskbedömning – kontor",
        description: "Mall för risker som stress, ergonomi, hot & våld, brand.",
        href: "/app/risker/ny",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera en incident och skapa uppföljningsåtgärder.",
        href: "/app/incidenter/rapportera",
      },
    ],
  },
  {
    key: "bygg",
    label: "Bygg",
    items: [
      {
        title: "Riskbedömning – byggarbetsplats",
        description: "Fallrisk, maskiner, kemikalier, lyft, buller och ordning & reda.",
        href: "/app/risker/ny",
      },
      {
        title: "Åtgärdsplan",
        description: "Följ upp åtgärder, deadlines och ansvar.",
        href: "/app/atgarder",
      },
      {
        title: "Incidentrapport",
        description: "Tillbud och olyckor med automatisk uppföljning.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Policy som är redo för inspektion.",
        href: "/app/policy",
      },
    ],
  },
  {
    key: "industri",
    label: "Industri",
    items: [
      {
        title: "Riskbedömning – industri",
        description: "Maskinsäkerhet, kemiska risker, buller, vibrationer.",
        href: "/app/risker/ny",
      },
      {
        title: "Åtgärdsplan",
        description: "Planera och följ upp förebyggande åtgärder.",
        href: "/app/atgarder",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera incident och säkra uppföljning.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Compliance",
        description: "Se vad som saknas för att nå 100% compliance.",
        href: "/app/compliance",
      },
    ],
  },
  {
    key: "butik",
    label: "Butik",
    items: [
      {
        title: "Riskbedömning – butik",
        description: "Hot & våld, ensamarbete, belastning, halkrisk.",
        href: "/app/risker/ny",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera hot/tillbud och skapa uppföljning.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Åtgärder",
        description: "Håll koll på åtgärder och deadlines.",
        href: "/app/atgarder",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Policy som uppfyller SAM-grunderna.",
        href: "/app/policy",
      },
    ],
  },
  {
    key: "transport",
    label: "Transport",
    items: [
      {
        title: "Riskbedömning – transport",
        description: "Trafikrisker, lastning, ensamarbete, trötthet.",
        href: "/app/risker/ny",
      },
      {
        title: "Åtgärdsplan",
        description: "Följ upp förebyggande och korrigerande åtgärder.",
        href: "/app/atgarder",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera incident/tillbud och skapa uppföljning.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Compliance",
        description: "Status för inspektionsberedskap.",
        href: "/app/compliance",
      },
    ],
  },
  {
    key: "vard",
    label: "Vård",
    items: [
      {
        title: "Riskbedömning – vård",
        description: "Smitta, hot & våld, belastning, stress och nattarbete.",
        href: "/app/risker/ny",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera tillbud/incident och följ upp.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Åtgärdsplan",
        description: "Åtgärder med deadlines och status.",
        href: "/app/atgarder",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Policy med fokus på rutiner och ansvar.",
        href: "/app/policy",
      },
    ],
  },
  {
    key: "restaurang",
    label: "Restaurang",
    items: [
      {
        title: "Riskbedömning – restaurang",
        description: "Halkrisk, värme, knivar, stress, ensamarbete.",
        href: "/app/risker/ny",
      },
      {
        title: "Åtgärder",
        description: "Åtgärda risker och håll deadlines.",
        href: "/app/atgarder",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera olyckor/tillbud.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Compliance",
        description: "Se vad som saknas för 100%.",
        href: "/app/compliance",
      },
    ],
  },
  {
    key: "skola",
    label: "Skola",
    items: [
      {
        title: "Riskbedömning – skola",
        description: "Hot & våld, stress, ergonomi, utrymning, ensamarbete.",
        href: "/app/risker/ny",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera incident och skapa uppföljning.",
        href: "/app/incidenter/rapportera",
      },
      {
        title: "Åtgärdsplan",
        description: "Följ upp åtgärder och ansvar.",
        href: "/app/atgarder",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Policy anpassad för skolverksamhet.",
        href: "/app/policy",
      },
    ],
  },
  {
    key: "annan",
    label: "Annan",
    items: [
      {
        title: "SAM-checklista (grund)",
        description: "Startpaket för systematiskt arbetsmiljöarbete.",
        href: "/app/compliance",
      },
      {
        title: "Arbetsmiljöpolicy",
        description: "Skapa policy som PDF.",
        href: "/app/policy",
      },
      {
        title: "Riskbedömning",
        description: "Skapa riskbedömning och åtgärder.",
        href: "/app/risker/ny",
      },
      {
        title: "Incidentrapport",
        description: "Rapportera incident och följ upp.",
        href: "/app/incidenter/rapportera",
      },
    ],
  },
];
