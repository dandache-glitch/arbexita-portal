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
