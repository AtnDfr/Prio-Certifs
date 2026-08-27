import { SharePointObjectivesRepository } from "./SharePointObjectivesRepository";
import { createMockContext, jsonResponse } from "./__tests__/mockContext";

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    Title: "AWS - Certified AI Practitioner",
    Provider: "AWS",
    Population: "Makers",
    Quota: 10,
    Obtenu: 3,
    EnCours: null,
    Difficult_x00e9_: "Avancé",
    ...overrides,
  };
}

describe("SharePointObjectivesRepository", () => {
  it("lit les 79 elements de la liste Objectifs Certifs", async () => {
    const rows = Array.from({ length: 79 }, (_, i) => makeRow({ Title: `Certif ${i}` }));
    const { context, get } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: rows }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications).toHaveLength(79);
  });

  it("convertit les champs numeriques vides en null", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, { value: [makeRow({ Quota: null, Obtenu: null, EnCours: null })] }),
    );

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications[0].objective).toEqual({ quota: null, obtenu: null, enCours: null });
  });

  it("mappe Difficult_x00e9_ vers difficulty", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [makeRow({ Difficult_x00e9_: "Débutant" })] }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications[0].difficulty).toBe("Débutant");
  });

  it("genere un id stable et coherent a partir du Title", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [makeRow({ Title: "AWS - Certified AI Practitioner" }), makeRow({ Title: "AWS - Certified AI Practitioner" })],
      }),
    );

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications[0].id).toBe(data.certifications[1].id);
    expect(data.certifications[0].id).toMatch(/^[a-z0-9-]+$/);
    expect(data.certifications[0].id).not.toMatch(/\s/);
  });

  it("l'absence de Population n'empeche pas le chargement", async () => {
    const { context, get } = createMockContext();
    const row = makeRow();
    delete (row as Record<string, unknown>).Population;
    get.mockResolvedValue(jsonResponse(200, { value: [row] }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications).toHaveLength(1);
  });

  it("suit la pagination SharePoint (odata.nextLink) sans tronquer les resultats", async () => {
    const { context, get } = createMockContext();
    const page1 = Array.from({ length: 5000 }, (_, i) => makeRow({ Title: `Certif page1 ${i}` }));
    const page2 = Array.from({ length: 12 }, (_, i) => makeRow({ Title: `Certif page2 ${i}` }));
    get
      .mockResolvedValueOnce(jsonResponse(200, { value: page1, "odata.nextLink": "https://x/next" }))
      .mockResolvedValueOnce(jsonResponse(200, { value: page2 }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(get).toHaveBeenCalledTimes(2);
    expect(data.certifications).toHaveLength(5012);
  });

  it("deduplique les providers", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, { value: [makeRow({ Title: "A" }), makeRow({ Title: "B" }), makeRow({ Title: "C" })] }),
    );

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.providers).toEqual(["AWS"]);
  });

  it("une ligne incomplete (Provider absent) ne fait pas planter le chargement : fournisseur par defaut 'Autre'", async () => {
    const { context, get } = createMockContext();
    const row = makeRow();
    delete (row as Record<string, unknown>).Provider;
    get.mockResolvedValue(jsonResponse(200, { value: [row] }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data.certifications[0].provider).toBe("Autre");
  });

  it("aucune certification retournee -> AppData vide, pas d'erreur", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));

    const data = await new SharePointObjectivesRepository(context).getAppData();

    expect(data).toEqual({ certifications: [], providers: [] });
  });
});
