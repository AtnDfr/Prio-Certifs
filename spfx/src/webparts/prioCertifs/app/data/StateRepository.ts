import type { AppData, CertPrioritizationState } from "../domain/types";

/**
 * Contrat de persistance des decisions COMEX (priorites, exceptions,
 * objectifs fixes). `save` est fire-and-forget cote appelant : chaque
 * implementation gere elle-meme son eventuel debounce/diff/erreurs.
 */
export interface StateRepository {
  load(): Promise<CertPrioritizationState>;
  save(state: CertPrioritizationState, data: AppData): void;
}
