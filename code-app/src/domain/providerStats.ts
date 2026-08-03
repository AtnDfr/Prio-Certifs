import type { AppData, Certification, CertPrioritizationState, ProviderStats } from "./types";
import { getBaseTarget, getEffectiveTarget, getSourceEnCours, getSourceObtenu } from "./objectives";
import { getGap } from "./derived";
import { getProviderPriority, isProviderTouched } from "./priority";

export function certsByProvider(data: AppData, provider: string): Certification[] {
  return data.certifications.filter((c) => c.provider === provider);
}

export function providerStats(
  state: CertPrioritizationState,
  data: AppData,
  provider: string,
): ProviderStats {
  const certs = certsByProvider(data, provider);

  // Objectif global (quota source) : donnee fixe, independante de l'objectif fixe.
  const withQuota = certs.filter((c) => getBaseTarget(c) !== null);
  const withObtenu = withQuota.filter((c) => getSourceObtenu(c) !== null);

  // Objectif fixe (decision COMEX, editable) : sert au gap, pas au ratio "certifies".
  const withTarget = certs.filter((c) => getEffectiveTarget(state, c) !== null);
  const withTargetObtenu = withTarget.filter((c) => getSourceObtenu(c) !== null);

  const withEnCours = certs.filter((c) => getSourceEnCours(c) !== null);

  return {
    certCount: certs.length,
    targetDefinedCount: withTarget.length,
    obtenuKnownCount: withObtenu.length,
    quota: withObtenu.reduce((s, c) => s + (getBaseTarget(c) as number), 0),
    obtenu: withObtenu.reduce((s, c) => s + (getSourceObtenu(c) as number), 0),
    gap: withTargetObtenu.reduce((s, c) => s + (getGap(state, c) as number), 0),
    enCoursKnownCount: withEnCours.length,
    enCours: withEnCours.reduce((s, c) => s + (getSourceEnCours(c) as number), 0),
    priority: getProviderPriority(state, provider),
    touched: isProviderTouched(state, provider),
  };
}
