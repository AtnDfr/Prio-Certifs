import type { WebPartContext } from "@microsoft/sp-webpart-base";
import type { AppData, Certification } from "../domain/types";
import type { DataRepository } from "./DataRepository";
import { getAllListItems } from "./spRestClient";
import { OBJECTIVES_FIELDS, OBJECTIVES_LIST_TITLE } from "./spConfig";
import { slugifyCertName } from "./slug";

type ObjectivesListItem = {
  Title: string;
  Provider: string | null;
  Population: string | null;
  Quota: number | null;
  Obtenu: number | null;
  EnCours: number | null;
  [key: string]: unknown; // Difficulte, lu via son nom interne configurable
};

/**
 * Lit la liste "Objectifs certifs" (lecture seule, remplie par un flux Power
 * Automate en amont) et la transforme en AppData. Contexte utilisateur
 * uniquement (SPHttpClient), pas de permission elevee.
 */
export class SharePointObjectivesRepository implements DataRepository {
  private readonly context: WebPartContext;
  private readonly siteUrl: string;

  constructor(context: WebPartContext, siteUrl: string = context.pageContext.web.serverRelativeUrl) {
    this.context = context;
    this.siteUrl = siteUrl;
  }

  async getAppData(): Promise<AppData> {
    const selectFields = [
      OBJECTIVES_FIELDS.title,
      OBJECTIVES_FIELDS.provider,
      OBJECTIVES_FIELDS.population,
      OBJECTIVES_FIELDS.quota,
      OBJECTIVES_FIELDS.obtenu,
      OBJECTIVES_FIELDS.enCours,
      OBJECTIVES_FIELDS.difficulte,
    ];

    const rows = await getAllListItems<ObjectivesListItem>(
      this.context,
      this.siteUrl,
      OBJECTIVES_LIST_TITLE,
      selectFields,
    );

    const certifications: Certification[] = rows
      .filter((row) => Boolean(row[OBJECTIVES_FIELDS.title]))
      .map((row) => {
        const name = String(row[OBJECTIVES_FIELDS.title]);
        const provider = (row[OBJECTIVES_FIELDS.provider] as string | null) ?? "Autre";
        return {
          id: slugifyCertName(name),
          name,
          provider,
          description: null, // pas de colonne source pour l'instant (cf. brief)
          difficulty: (row[OBJECTIVES_FIELDS.difficulte] as string | null) ?? null,
          objective: {
            quota: toNullableNumber(row[OBJECTIVES_FIELDS.quota]),
            obtenu: toNullableNumber(row[OBJECTIVES_FIELDS.obtenu]),
            enCours: toNullableNumber(row[OBJECTIVES_FIELDS.enCours]),
          },
        };
      });

    const providers = Array.from(new Set(certifications.map((c) => c.provider))).sort((a, b) =>
      a.localeCompare(b),
    );

    return { certifications, providers };
  }
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
