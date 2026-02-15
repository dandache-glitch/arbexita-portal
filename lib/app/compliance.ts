export type ComplianceStepKey = "policy" | "risk" | "actions" | "incidents" | "annual";

export type ComplianceStatus = {
  policy: boolean;
  risk: boolean;
  actions: boolean;
  incidents: boolean;
  annual: boolean;
  overdueActions: number;
};

export function computeComplianceScore(status: ComplianceStatus): number {
  const keys: ComplianceStepKey[] = ["policy", "risk", "actions", "incidents", "annual"];
  const done = keys.filter((k) => status[k]).length;
  return Math.round((done / keys.length) * 100);
}
