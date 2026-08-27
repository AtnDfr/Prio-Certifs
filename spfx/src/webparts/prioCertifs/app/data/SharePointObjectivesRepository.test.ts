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
});
