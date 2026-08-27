import type { AppData, CertPrioritizationState } from "../domain/types";

/**
 * Contrat de persistance des decisions COMEX (priorites, exceptions,
 * objectifs fixes). `save` est fire-and-forget cote appelant : chaque
 * implementation gere elle-meme son eventuel debounce/diff/erreurs.
 */
export interface StateRepository {
  load(): Promise<CertPrioritizationState>;
  save(state: CertPrioritizationState, data: AppData): void;
  /** Notifie l'appelant si une sauvegarde echoue, pour que l'UI ne masque pas l'erreur silencieusement. */
  onSaveError?(callback: (error: unknown) => void): void;
}
