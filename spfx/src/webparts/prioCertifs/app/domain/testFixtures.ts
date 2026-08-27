import type { Certification, CertPrioritizationState } from "./types";
import { emptyState } from "./types";

export function makeCert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: overrides.id ?? "test-cert",
    name: overrides.name ?? "Test Certification",
    provider: overrides.provider ?? "TestProvider",
    description: overrides.description ?? null,
    difficulty: overrides.difficulty ?? null,
    objective: {
      quota: null,
      obtenu: null,
      enCours: null,
      ...overrides.objective,
    },
  };
}

export function makeState(overrides: Partial<CertPrioritizationState> = {}): CertPrioritizationState {
  return { ...emptyState(), ...overrides };
}
