import type { AppData, Certification } from "../domain/types";
import { emptyState } from "../domain/types";
import { SharePointPrioritiesRepository } from "./SharePointPrioritiesRepository";
import { createMockContext, jsonResponse } from "./__tests__/mockContext";

function makeCert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: "aws-certified-ai-practitioner",
    name: "AWS - Certified AI Practitioner",
    provider: "AWS",
    description: null,
    difficulty: "Avancé",
    objective: { quota: 10, obtenu: 3, enCours: null },
    ...overrides,
  };
}

function makeData(certs: Certification[] = [makeCert()]): AppData {
  return { certifications: certs, providers: Array.from(new Set(certs.map((c) => c.provider))) };
}

/** Attend que le save() debounce (600ms) declenche et resolve son flush interne. */
async function flushDebounce() {
  await jest.advanceTimersByTimeAsync(700);
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("SharePointPrioritiesRepository.load", () => {
  it("lit une priorite existante depuis Priorités Certifs", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [{ Id: 1, Title: "AWS - Certified AI Practitioner", Provider: "AWS", PrioriteProvider: 6, Override: null, Target: 5 }],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    expect(state.providerPriorities.AWS).toBe(6);
    expect(state.certTargets["aws-certified-ai-practitioner"]).toBe(5);
    expect(state.certOverrides["aws-certified-ai-practitioner"]).toBeUndefined();
  });

  it("conserve 0 comme vraie valeur de priorite, distincte de l'absence", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [{ Id: 1, Title: "AWS - Certified AI Practitioner", Provider: "AWS", PrioriteProvider: 0, Override: null, Target: null }],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    expect(state.providerPriorities.AWS).toBe(0);
  });

  it("Override et Target vides restent absents de l'etat (heritage), pas convertis en 0", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [{ Id: 1, Title: "AWS - Certified AI Practitioner", Provider: "AWS", PrioriteProvider: null, Override: null, Target: null }],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    expect(state.certOverrides["aws-certified-ai-practitioner"]).toBeUndefined();
    expect(state.certTargets["aws-certified-ai-practitioner"]).toBeUndefined();
    expect(state.providerPriorities.AWS).toBeUndefined();
  });

  it("plusieurs lignes du meme provider avec la meme PrioriteProvider : coherent, une seule valeur retenue", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [
          { Id: 1, Title: "AWS - A", Provider: "AWS", PrioriteProvider: 6, Override: null, Target: null },
          { Id: 2, Title: "AWS - B", Provider: "AWS", PrioriteProvider: 6, Override: null, Target: null },
        ],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    expect(state.providerPriorities.AWS).toBe(6);
  });

  it("PrioriteProvider contradictoires pour un meme provider : la derniere ligne lue l'emporte (pas de fusion/erreur)", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [
          { Id: 1, Title: "AWS - A", Provider: "AWS", PrioriteProvider: 6, Override: null, Target: null },
          { Id: 2, Title: "AWS - B", Provider: "AWS", PrioriteProvider: 9, Override: null, Target: null },
        ],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    // Comportement actuel documente : chaque ligne ecrase la precedente pour le meme provider,
    // donc c'est la valeur de la DERNIERE ligne renvoyee par SharePoint (ordre non garanti par
    // l'app) qui l'emporte. Ce n'est pas un plantage, mais ce n'est pas une "fusion" non plus.
    expect(state.providerPriorities.AWS).toBe(9);
  });

  it("une ligne SharePoint orpheline (Title ne correspondant a aucune certification connue) n'empeche pas le chargement", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [{ Id: 1, Title: "Certification supprimee depuis", Provider: "AWS", PrioriteProvider: 6, Override: null, Target: null }],
      }),
    );

    const state = await new SharePointPrioritiesRepository(context).load();

    // La cle est simplement inutilisee par l'UI (aucune certif de ce nom dans AppData) : pas d'erreur.
    expect(state.providerPriorities.AWS).toBe(6);
  });
});

describe("SharePointPrioritiesRepository.save — creation", () => {
  it("cree une ligne (Title, jamais Certification, aucun __metadata) quand aucune ligne n'existe", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));
    post.mockResolvedValue(jsonResponse(201, { Id: 42 }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    const state = { ...emptyState(), providerPriorities: { AWS: 7 } };
    repo.save(state, data);
    await flushDebounce();

    expect(post).toHaveBeenCalledTimes(1);
    const [url, , options] = post.mock.calls[0];
    expect(url).toMatch(/\/items$/);
    expect(url).not.toMatch(/\/items\(/);
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty("Title", "AWS - Certified AI Practitioner");
    expect(body).not.toHaveProperty("Certification");
    expect(body).not.toHaveProperty("__metadata");
  });
});

describe("SharePointPrioritiesRepository.save — mise a jour et anti-doublon", () => {
  it("met a jour (MERGE sur l'item existant) plutot que de creer, et n'ecrit rien si rien n'a change", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(
      jsonResponse(200, {
        value: [{ Id: 42, Title: "AWS - Certified AI Practitioner", Provider: "AWS", PrioriteProvider: null, Override: null, Target: null }],
      }),
    );
    post.mockResolvedValue(jsonResponse(200, {}));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    // 1) un changement reel -> une seule requete, en MERGE sur l'item 42
    const changed = { ...initialState, providerPriorities: { AWS: 7 } };
    repo.save(changed, data);
    await flushDebounce();

    expect(post).toHaveBeenCalledTimes(1);
    const [url, , options] = post.mock.calls[0];
    expect(url).toMatch(/\/items\(42\)$/);
    expect(options.headers["X-HTTP-Method"]).toBe("MERGE");
    expect(options.headers["IF-MATCH"]).toBe("*");

    // 2) une deuxieme sauvegarde avec exactement le meme etat -> aucune nouvelle requete (pas de doublon)
    post.mockClear();
    repo.save(changed, data);
    await flushDebounce();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("SharePointPrioritiesRepository.save — heritage, override, PrioriteEffective, Target null", () => {
  it("un provider touche sans override individuel hérite la priorite du provider", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));
    post.mockResolvedValue(jsonResponse(201, { Id: 1 }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    const state = { ...emptyState(), providerPriorities: { AWS: 9 } };
    repo.save(state, data);
    await flushDebounce();

    const body = JSON.parse(post.mock.calls[0][2].body);
    expect(body.PrioriteProvider).toBe(9);
    expect(body.Override).toBeNull();
    expect(body.PrioriteEffective).toBe(9); // pas d'override -> herite du provider
  });

  it("un override individuel gagne sur la priorite du provider dans PrioriteEffective", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));
    post.mockResolvedValue(jsonResponse(201, { Id: 1 }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    const state = {
      ...emptyState(),
      providerPriorities: { AWS: 9 },
      certOverrides: { "aws-certified-ai-practitioner": 2 },
    };
    repo.save(state, data);
    await flushDebounce();

    const body = JSON.parse(post.mock.calls[0][2].body);
    expect(body.Override).toBe(2);
    expect(body.PrioriteEffective).toBe(2); // override gagne
  });

  it("persiste Target y compris quand il vaut explicitement null", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));
    post.mockResolvedValue(jsonResponse(201, { Id: 1 }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    const state = { ...emptyState(), certTargets: { "aws-certified-ai-practitioner": null } };
    repo.save(state, data);
    await flushDebounce();

    const body = JSON.parse(post.mock.calls[0][2].body);
    expect(body).toHaveProperty("Target", null);
  });
});

describe("SharePointPrioritiesRepository — ouverture sans modification et retry apres echec", () => {
  it("l'ouverture de l'app (load + primeBaseline) ne declenche aucune ecriture si rien n'est modifie ensuite", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    // Meme le premier appel a save() (declenche par le montage du Provider React) avec l'etat
    // strictement identique a celui charge ne doit ecrire aucune des lignes.
    repo.save(initialState, data);
    await flushDebounce();

    expect(post).not.toHaveBeenCalled();
  });

  it("apres un echec de sauvegarde, une modification ulterieure est retentee et aboutit", async () => {
    const { context, get, post } = createMockContext();
    get.mockResolvedValue(jsonResponse(200, { value: [] }));
    post.mockResolvedValueOnce(jsonResponse(403, { error: { message: "Access denied" } }));

    const repo = new SharePointPrioritiesRepository(context);
    const initialState = await repo.load();
    const data = makeData();
    repo.primeBaseline(initialState, data);

    // 1) premiere tentative -> echoue (403), l'etat interne ne doit pas etre marque comme sauvegarde
    const attempt1 = { ...emptyState(), providerPriorities: { AWS: 5 } };
    repo.save(attempt1, data);
    await flushDebounce();
    expect(post).toHaveBeenCalledTimes(1);

    // 2) nouvelle tentative (meme valeur ou une autre) -> comme l'echec precedent n'a pas ete
    // enregistre comme "sauvegarde", elle doit repartir en ecriture, pas etre ignoree comme un doublon.
    post.mockResolvedValueOnce(jsonResponse(201, { Id: 99 }));
    repo.save(attempt1, data);
    await flushDebounce();

    expect(post).toHaveBeenCalledTimes(2);
  });
});
