import * as React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import PrioCertifsApp from "../App";
import { createMockContext, jsonResponse } from "../data/__tests__/mockContext";

const OBJECTIVES_ROWS = [
  { Id: 1, Title: "AWS - Certified AI Practitioner", Provider: "AWS", Population: "Makers", Quota: 10, Obtenu: 3, EnCours: null, Difficult_x00e9_: "Avancé" },
  { Id: 2, Title: "AWS - Cloud Practitioner Foundational", Provider: "AWS", Population: "Makers", Quota: null, Obtenu: null, EnCours: null, Difficult_x00e9_: "Débutant" },
  { Id: 3, Title: "Azure - AI Fundamentals", Provider: "Azure", Population: "Makers", Quota: 5, Obtenu: 1, EnCours: 2, Difficult_x00e9_: "Débutant" },
  { Id: 4, Title: "Anthropic - Architect Foundation", Provider: "Anthropic", Population: "Makers", Quota: null, Obtenu: null, EnCours: null, Difficult_x00e9_: "Avancé" },
];

const PRIORITIES_ROWS = [
  { Id: 101, Title: "AWS - Certified AI Practitioner", Provider: "AWS", PrioriteProvider: 7, Override: 9, PrioriteEffective: 9, Target: 8 },
];

function mockGetForBothLists() {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes("Objectifs")) return Promise.resolve(jsonResponse(200, { value: OBJECTIVES_ROWS }));
    if (url.includes("Priorit")) return Promise.resolve(jsonResponse(200, { value: PRIORITIES_ROWS }));
    return Promise.resolve(jsonResponse(404, {}));
  });
}

describe("PrioCertifsApp — rendu des 4 vues avec des donnees representatives (sans SharePoint reel)", () => {
  it("affiche le Dashboard par defaut, avec plusieurs providers, quotas renseignes/non renseignes et difficultes variees", async () => {
    const { context, get } = createMockContext();
    get.mockImplementation(mockGetForBothLists());

    render(<PrioCertifsApp context={context} />);

    expect(await screen.findByText(/Répartition des priorités/)).toBeInTheDocument();
    expect(screen.getByText(/Catalogue : 4 certifications · 3 fournisseurs/)).toBeInTheDocument();
  });

  it("affiche BUST/COMEX avec la priorite du provider", async () => {
    const { context, get } = createMockContext();
    get.mockImplementation(mockGetForBothLists());

    render(<PrioCertifsApp context={context} />);
    await screen.findByText(/Répartition des priorités/);

    fireEvent.click(screen.getByRole("button", { name: "BUST" }));

    expect(await screen.findByText("Priorisation par fournisseur")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("Azure")).toBeInTheDocument();
  });

  it("affiche Providers avec l'override individuel applique", async () => {
    const { context, get } = createMockContext();
    get.mockImplementation(mockGetForBothLists());

    render(<PrioCertifsApp context={context} />);
    await screen.findByText(/Répartition des priorités/);

    fireEvent.click(screen.getByRole("button", { name: "Providers" }));
    // Le fournisseur par defaut est le premier par ordre alphabetique (Anthropic) ; on choisit AWS explicitement.
    fireEvent.click(screen.getAllByRole("button", { name: /AWS/ })[0]);

    expect(await screen.findByText(/Certifications AWS/)).toBeInTheDocument();
    // La certif overridee (9) doit apparaitre marquee "ajustée" dans le tableau.
    expect(screen.getByText("ajustée")).toBeInTheDocument();
  });

  it("affiche Certifications sans erreur, toutes les certifs listees", async () => {
    const { context, get } = createMockContext();
    get.mockImplementation(mockGetForBothLists());

    render(<PrioCertifsApp context={context} />);
    await screen.findByText(/Répartition des priorités/);

    fireEvent.click(screen.getByRole("button", { name: "Certifications" }));

    expect(await screen.findByText(/Vue Certification/)).toBeInTheDocument();
    expect(screen.getByText(/4 certification\(s\) affichée\(s\) sur 4/)).toBeInTheDocument();
  });

  it("affiche un message d'erreur explicite si le chargement echoue (liste introuvable)", async () => {
    const { context, get } = createMockContext();
    get.mockResolvedValue(jsonResponse(404, { error: { message: "List 'Objectifs Certifs' does not exist" } }));

    render(<PrioCertifsApp context={context} />);

    expect(await screen.findByText(/Erreur de chargement des données SharePoint/)).toBeInTheDocument();
  });

  it("affiche un message clair si une sauvegarde echoue (ex. pas de droit d'ecriture), sans masquer l'erreur", async () => {
    const { context, get, post } = createMockContext();
    get.mockImplementation(mockGetForBothLists());
    post.mockResolvedValue(jsonResponse(403, { error: { message: "Access denied" } }));

    render(<PrioCertifsApp context={context} />);
    await screen.findByText(/Répartition des priorités/);

    fireEvent.click(screen.getByRole("button", { name: "BUST" }));
    await screen.findByText("Priorisation par fournisseur");

    const azureRow = screen.getByText("Azure").closest("tr") as HTMLElement;
    fireEvent.click(within(azureRow).getByRole("button", { name: "8" }));

    await waitFor(
      () => {
        expect(screen.getByText(/n'a pas pu être enregistrée dans SharePoint/)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
