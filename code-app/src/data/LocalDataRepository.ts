import type { AppData } from "../domain/types";
import type { DataRepository } from "./DataRepository";
import mockData from "./mockData.json";

/**
 * Implementation de reference pour la phase 1 : donnees locales (le meme
 * catalogue que celui embarque dans le prototype HTML aujourd'hui, extrait
 * depuis index.html pour rester fidele aux vraies donnees). Aucune
 * dependance reseau. A remplacer par une implementation SharePoint/Easy
 * Training une fois les schemas et droits valides (etape 9), sans changer
 * un seul composant UI puisqu'ils ne connaissent que DataRepository.
 */
export class LocalDataRepository implements DataRepository {
  async getAppData(): Promise<AppData> {
    return mockData as AppData;
  }
}
