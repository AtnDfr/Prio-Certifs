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
      headers: { Accept: "application/json;odata=nometadata" },
    });
    await assertOk(response, `Lecture de la liste "${listTitle}"`);
    const json = await response.json();
    const batch: T[] = json?.value ?? [];
    items.push(...batch);
    url = json?.["odata.nextLink"] ?? "";
  }

  return items;
}

/** Cree un item dans la liste et retourne son Id. */
export async function createListItem(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
  itemTypeFullName: string,
  fields: Record<string, unknown>,
): Promise<number> {
  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: ODATA_HEADERS,
    body: JSON.stringify({ __metadata: { type: itemTypeFullName }, ...fields }),
  });
  await assertOk(response, `Création d'un item dans "${listTitle}"`);
  const json = await response.json();
  return json.Id ?? json.ID;
}

/** Met a jour un item existant (MERGE, ne touche que les champs fournis). */
export async function updateListItem(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
  itemId: number,
  itemTypeFullName: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      ...ODATA_HEADERS,
      "IF-MATCH": "*",
      "X-HTTP-Method": "MERGE",
    },
    body: JSON.stringify({ __metadata: { type: itemTypeFullName }, ...fields }),
  });
  await assertOk(response, `Mise à jour d'un item dans "${listTitle}"`);
}

/** Nom d'entite OData de la liste (necessaire pour __metadata.type sur create/update). */
export async function getListItemEntityTypeFullName(
  context: WebPartContext,
  siteUrl: string,
  listTitle: string,
): Promise<string> {
  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')?$select=ListItemEntityTypeFullName`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
    headers: { Accept: "application/json;odata=nometadata" },
  });
  await assertOk(response, `Lecture des métadonnées de "${listTitle}"`);
  const json = await response.json();
  return json.ListItemEntityTypeFullName;
}
