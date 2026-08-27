import { SPHttpClient, type SPHttpClientResponse } from "@microsoft/sp-http";
import type { WebPartContext } from "@microsoft/sp-webpart-base";

/**
 * Petit client REST SharePoint minimal, base sur SPHttpClient (contexte de
 * l'utilisateur connecte, aucune permission elevee — cf. contrainte
 * securite du brief). SPHttpClient gere lui-meme les cookies d'auth et le
 * request digest (X-RequestDigest) pour les appels POST vers le meme site.
 */

const ODATA_HEADERS = {
  Accept: "application/json;odata=nometadata",
  "Content-Type": "application/json;odata=nometadata",
};

async function assertOk(response: SPHttpClientResponse, action: string): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${action} a echoue (HTTP ${response.status}) : ${body}`);
  }
}

/** Recupere tous les items d'une liste (pagine automatiquement au-dela de la limite par defaut de 100). */
export async function getAllListItems<T>(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
  selectFields: string[],
): Promise<T[]> {
  const items: T[] = [];
  let url: string =
    `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items` +
    `?$select=${selectFields.join(",")}&$top=5000`;

  while (url) {
    const response: SPHttpClientResponse = await context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
      // Empeche explicitement toute reponse mise en cache par le navigateur :
      // chaque ouverture de l'app doit refleter l'etat courant de la liste.
      headers: { Accept: "application/json;odata=nometadata", "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    await assertOk(response, `Lecture de la liste "${listTitle}"`);
    const json = await response.json();
    const batch: T[] = json?.value ?? [];
    items.push(...batch);
    url = json?.["odata.nextLink"] ?? "";
  }

  return items;
}

/**
 * Cree un item dans la liste et retourne son Id.
 *
 * Pas de `__metadata` dans le corps : c'est une syntaxe OData v3 (verbose),
 * incompatible avec le header `odata-version: 4.0` que SPHttpClient envoie
 * par defaut en meme temps que `odata=nometadata`. Avec ce format, SharePoint
 * n'a de toute facon pas besoin qu'on precise le type de l'entite : l'URL de
 * l'endpoint (la liste cible) suffit a l'identifier.
 */
export async function createListItem(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
  fields: Record<string, unknown>,
): Promise<number> {
  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: ODATA_HEADERS,
    body: JSON.stringify(fields),
  });
  await assertOk(response, `Création d'un item dans "${listTitle}"`);
  const json = await response.json();
  return json.Id ?? json.ID;
}

/** Met a jour un item existant (MERGE, ne touche que les champs fournis). Meme remarque que createListItem sur l'absence de `__metadata`. */
export async function updateListItem(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
  itemId: number,
  fields: Record<string, unknown>,
): Promise<void> {
  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      ...ODATA_HEADERS,
      "IF-MATCH": "*",
      "X-HTTP-Method": "MERGE",
    },
    body: JSON.stringify(fields),
  });
  await assertOk(response, `Mise à jour d'un item dans "${listTitle}"`);
}
