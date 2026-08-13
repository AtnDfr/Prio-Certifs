import type { AppData } from "../domain/types";

/**
 * Contrat d'acces aux donnees "source" (certifications, providers, objectifs
 * source). Delibrement minimal et sans rien de specifique a une techno de
 * connecteur (SharePoint, Easy Training...), pour que les composants ne
 * dependent jamais que de cette interface. cf. etape 7 de la note de cadrage.
 */
export interface DataRepository {
  getAppData(): Promise<AppData>;
}
