import type { AppData } from "../domain/types";
import type { DataRepository } from "./DataRepository";

/**
 * Implementation par defaut : lit un fichier JSON statique servi a cote de
 * l'application (public/data.json -> copie telle quelle dans dist/ par
 * Vite, jamais integree au bundle JS). Recupere a CHAQUE chargement de page
 * via fetch(), pas au moment du build.
 *
 * C'est ce qui permet a un flux Power Automate de mettre les donnees a jour
 * en remplacant simplement ce fichier (via l'API GitLab/GitHub), sans
 * jamais avoir besoin de reconstruire ou republier le site — donc sans
 * dependre d'un runner CI/CD.
 */
export class JsonFileDataRepository implements DataRepository {
  private readonly url: string;

  constructor(url: string = `${import.meta.env.BASE_URL}data.json`) {
    this.url = url;
  }

  async getAppData(): Promise<AppData> {
    const response = await fetch(this.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Impossible de charger ${this.url} (HTTP ${response.status})`);
    }
    return (await response.json()) as AppData;
  }
}
