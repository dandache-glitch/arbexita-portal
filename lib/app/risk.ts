export function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function riskLevel(probability: number, consequence: number) {
  const p = clampInt(probability, 1, 5);
  const c = clampInt(consequence, 1, 5);
  return p * c;
}

export function riskTone(level: number): "ok" | "warn" | "danger" {
  if (level >= 15) return "danger";
  if (level >= 9) return "warn";
  return "ok";
}

export function riskLabel(level: number) {
  const tone = riskTone(level);
  if (tone === "danger") return "Hög";
  if (tone === "warn") return "Måttlig";
  return "Låg";
}

export type LikelihoodOption = { value: 1 | 2 | 3 | 4 | 5; label: string; example: string };
export type ConsequenceOption = { value: 1 | 2 | 3 | 4 | 5; label: string; example: string };

export const LIKELIHOOD_OPTIONS: LikelihoodOption[] = [
  { value: 1, label: "Ovanligt", example: "Har inte hänt hos oss" },
  { value: 2, label: "Sällan", example: "Kan hända någon gång" },
  { value: 3, label: "Ibland", example: "Händer vissa perioder" },
  { value: 4, label: "Ofta", example: "Händer flera gånger/år" },
  { value: 5, label: "Mycket ofta", example: "Händer regelbundet" },
];

export const CONSEQUENCE_OPTIONS: ConsequenceOption[] = [
  { value: 1, label: "Liten", example: "Obehag / ingen frånvaro" },
  { value: 2, label: "Måttlig", example: "Kort frånvaro" },
  { value: 3, label: "Allvarlig", example: "Vård / sjukskrivning" },
  { value: 4, label: "Mycket allvarlig", example: "Svår skada" },
  { value: 5, label: "Kritisk", example: "Livshotande" },
];
