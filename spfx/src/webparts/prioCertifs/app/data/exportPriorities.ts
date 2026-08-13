import type { AppData, CertPrioritizationState } from "../domain/types";
import { getEffectiveTarget, getSourceEnCours, getSourceObtenu, isTargetOverridden } from "../domain/objectives";
import { getCertStatus, getProjection, getResteAEngager } from "../domain/derived";
import { getCertOverride, getEffectivePriority, getProviderPriority, isPrioritySuggested } from "../domain/priority";

/** Meme forme de payload que l'export JSON du prototype HTML (bouton "Exporter les priorités"). */
export function buildExportPayload(state: CertPrioritizationState, data: AppData) {
  return {
    source: "Prio Certifs - Wavestone",
    exportedAt: new Date().toISOString(),
    providers: data.providers.map((p) => ({ provider: p, priority: getProviderPriority(state, p) })),
    certifications: data.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      provider: c.provider,
      difficulty: c.difficulty,
      description: c.description,
      certifiedCount: getSourceObtenu(c),
      inProgressCount: getSourceEnCours(c),
      projectedCount: getProjection(c),
      targetCount: getEffectiveTarget(state, c),
      targetOverridden: isTargetOverridden(state, c),
      remainingToLaunch: getResteAEngager(state, c),
      status: getCertStatus(state, c),
      priority: getEffectivePriority(state, c),
      priorityOverridden: getCertOverride(state, c.id) !== null,
      prioritySuggested: isPrioritySuggested(state, c),
    })),
  };
}

export function downloadExportedPriorities(state: CertPrioritizationState, data: AppData): void {
  const payload = buildExportPayload(state, data);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `prio-certifs-wavestone-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
