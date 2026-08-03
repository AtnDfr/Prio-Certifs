import type { AppData } from "../domain/types";
import type { DataRepository } from "./DataRepository";

/**
 * Squelette pour la phase 2 (etape 9 de la note de cadrage). Volontairement
 * non implemente : la connexion SharePoint/Easy Training ne demarre qu'apres
 * validation de l'equivalence fonctionnelle avec LocalDataRepository, et
 * une fois les schemas de liste et les droits d'acces confirmes.
 */
export class SharePointDataRepository implements DataRepository {
  async getAppData(): Promise<AppData> {
    throw new Error(
      "SharePointDataRepository n'est pas encore implemente (etape 9 de la migration).",
    );
  }
}
