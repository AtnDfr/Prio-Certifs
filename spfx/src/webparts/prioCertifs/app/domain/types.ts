export type Objective = {
  quota: number | null;
  obtenu: number | null;
  enCours: number | null;
};

export type Certification = {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  difficulty: string | null;
  objective: Objective;
};

export type AppData = {
  certifications: Certification[];
  providers: string[];
};

/** Decisions COMEX, persistees dans la liste SharePoint "Priorités Certifs" (cf. data/SharePointPrioritiesRepository.ts). */
export type CertPrioritizationState = {
  providerPriorities: Record<string, number>;
  certOverrides: Record<string, number>;
  /** number = objectif explicite ; null = "pas d'objectif" force explicitement. */
  certTargets: Record<string, number | null>;
};

export function emptyState(): CertPrioritizationState {
  return { providerPriorities: {}, certOverrides: {}, certTargets: {} };
}

export type CertStatus = "atteint" | "bonneVoie" | "accelerer" | "na";

export type ProviderStats = {
  certCount: number;
  targetDefinedCount: number;
  obtenuKnownCount: number;
  quota: number;
  obtenu: number;
  gap: number;
  enCoursKnownCount: number;
  enCours: number;
  priority: number;
  touched: boolean;
};
