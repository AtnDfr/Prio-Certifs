import type { AppData } from "../domain/types";
import type { DataRepository } from "./DataRepository";

/**
 * Squelette pour une eventuelle lecture directe SharePoint/Easy Training
 * cote client (auth navigateur, etc.). Volontairement non implemente :
 * l'approche retenue pour l'instant est plus simple — un flux Power
 * Automate ecrit directement dans public/data.json (cf.
 * JsonFileDataRepository), sans authentification cote app.
 */
export class SharePointDataRepository implements DataRepository {
  async getAppData(): Promise<AppData> {
    throw new Error(
      "SharePointDataRepository n'est pas encore implemente (etape 9 de la migration).",
    );
  }
}
