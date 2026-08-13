import type { WebPartContext } from "@microsoft/sp-webpart-base";
import type { AppData, Certification, CertPrioritizationState } from "../domain/types";
import { emptyState } from "../domain/types";
import { getEffectivePriority } from "../domain/priority";
import type { StateRepository } from "./StateRepository";
import {
  createListItem,
  getAllListItems,
  getListItemEntityTypeFullName,
  updateListItem,
} from "./spRestClient";
import { PRIORITIES_FIELDS, PRIORITIES_LIST_TITLE } from "./spConfig";
import { slugifyCertName } from "./slug";

type PrioritiesListItem = {
  Id: number;
  [key: string]: unknown; // cles = PRIORITIES_FIELDS.*, noms internes configurables
};

type RowSnapshot = {
  provider: string;
  providerPriority: number | null;
  override: number | null;
  target: number | null;
  effective: number;
};

const SAVE_DEBOUNCE_MS = 600;

/**
 * Lit/ecrit la liste "Priorités Certifs" (une ligne par certification),
 * contexte utilisateur uniquement (SPHttpClient), aucune permission elevee.
 *
 * Limitation connue et documentee (cf. README) : le modele tri-etat du
 * prototype (absent = herite du quota source ; null = "pas d'objectif"
 * force explicitement ; nombre = override) est reduit a un bi-etat cote
 * SharePoint, la colonne `Target` etant un simple nombre nullable : blanc
 * est traite comme "herite / pas d'objectif" dans les deux cas, seul
 * l'override numerique explicite est distingue.
 */
export class SharePointPrioritiesRepository implements StateRepository {
  private readonly context: WebPartContext;
  private readonly siteUrl: string;
  private itemIdsByCertName = new Map<string, number>();
  private lastSavedRowByCertId = new Map<string, RowSnapshot>();
  private itemTypeFullName: string | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(context: WebPartContext, siteUrl: string = context.pageContext.web.serverRelativeUrl) {
    this.context = context;
    this.siteUrl = siteUrl;
  }

  async load(): Promise<CertPrioritizationState> {
    const selectFields = [
      "Id",
      PRIORITIES_FIELDS.certification,
      PRIORITIES_FIELDS.provider,
      PRIORITIES_FIELDS.prioriteProvider,
      PRIORITIES_FIELDS.override,
      PRIORITIES_FIELDS.target,
    ];

    const rows = await getAllListItems<PrioritiesListItem>(
      this.context,
      this.siteUrl,
      PRIORITIES_LIST_TITLE,
      selectFields,
    );

    const state = emptyState();

    for (const row of rows) {
      const certName = row[PRIORITIES_FIELDS.certification] as string | null;
      if (!certName) continue;
      const certId = slugifyCertName(certName);
      this.itemIdsByCertName.set(certName, row.Id);

      const provider = row[PRIORITIES_FIELDS.provider] as string | null;
      const providerPriority = toNullableNumber(row[PRIORITIES_FIELDS.prioriteProvider]);
      const override = toNullableNumber(row[PRIORITIES_FIELDS.override]);
      const target = toNullableNumber(row[PRIORITIES_FIELDS.target]);

      if (provider && providerPriority !== null) {
        state.providerPriorities[provider] = providerPriority;
      }
      if (override !== null) {
        state.certOverrides[certId] = override;
      }
      if (target !== null) {
        state.certTargets[certId] = target;
      }

    }

    return state;
  }

  /**
   * A appeler une fois AppData ET l'etat initial charges (avant tout
   * changement utilisateur), pour que le premier `save()` ne re-ecrive que
   * les lignes reellement modifiees plutot qu'une resynchronisation complete.
   */
  primeBaseline(state: CertPrioritizationState, data: AppData): void {
    for (const cert of data.certifications) {
      this.lastSavedRowByCertId.set(cert.id, computeRow(state, cert));
    }
  }

  /** Fire-and-forget, debounce court : n'ecrit que les lignes dont la valeur calculee a change. */
  save(state: CertPrioritizationState, data: AppData): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.flush(state, data).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Échec de l'enregistrement des priorités dans SharePoint :", error);
      });
    }, SAVE_DEBOUNCE_MS);
  }

  private async flush(state: CertPrioritizationState, data: AppData): Promise<void> {
    const itemType = await this.ensureItemType();

    await Promise.all(
      data.certifications.map(async (cert) => {
        const row = computeRow(state, cert);
        const previous = this.lastSavedRowByCertId.get(cert.id);
        if (previous && rowsEqual(previous, row)) return;

        const fields = {
          [PRIORITIES_FIELDS.certification]: cert.name,
          [PRIORITIES_FIELDS.provider]: row.provider,
          [PRIORITIES_FIELDS.prioriteProvider]: row.providerPriority,
          [PRIORITIES_FIELDS.override]: row.override,
          [PRIORITIES_FIELDS.prioriteEffective]: row.effective,
          [PRIORITIES_FIELDS.target]: row.target,
        };

        const existingId = this.itemIdsByCertName.get(cert.name);
        if (existingId) {
          await updateListItem(this.context, this.siteUrl, PRIORITIES_LIST_TITLE, existingId, itemType, fields);
        } else {
          const newId = await createListItem(this.context, this.siteUrl, PRIORITIES_LIST_TITLE, itemType, fields);
          this.itemIdsByCertName.set(cert.name, newId);
        }

        this.lastSavedRowByCertId.set(cert.id, row);
      }),
    );
  }

  private async ensureItemType(): Promise<string> {
    if (!this.itemTypeFullName) {
      this.itemTypeFullName = await getListItemEntityTypeFullName(this.context, this.siteUrl, PRIORITIES_LIST_TITLE);
    }
    return this.itemTypeFullName;
  }
}

function computeRow(state: CertPrioritizationState, cert: Certification): RowSnapshot {
  const providerPriority = Object.prototype.hasOwnProperty.call(state.providerPriorities, cert.provider)
    ? state.providerPriorities[cert.provider]
    : null;
  const override = Object.prototype.hasOwnProperty.call(state.certOverrides, cert.id)
    ? state.certOverrides[cert.id]
    : null;
  // Bi-etat cote SharePoint : seul l'override numerique explicite est ecrit,
  // "absent" et "null explicite" sont tous deux representes par un champ vide.
  const target = state.certTargets[cert.id] ?? null;

  return {
    provider: cert.provider,
    providerPriority,
    override,
    target,
    effective: getEffectivePriority(state, cert),
  };
}

function rowsEqual(a: RowSnapshot, b: RowSnapshot): boolean {
  return (
    a.provider === b.provider &&
    a.providerPriority === b.providerPriority &&
    a.override === b.override &&
    a.target === b.target &&
    a.effective === b.effective
  );
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
