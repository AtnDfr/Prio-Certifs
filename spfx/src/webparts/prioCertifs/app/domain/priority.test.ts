import {
  DEFAULT_PRIORITY,
  getCertOverride,
  getEffectivePriority,
  getProviderPriority,
  getSuggestedPriority,
  isPrioritySuggested,
  isProviderTouched,
} from "./priority";
import { makeCert, makeState } from "./testFixtures";

describe("provider priority", () => {
  it("defaults to 5 when never touched", () => {
    const state = makeState();
    expect(getProviderPriority(state, "AWS")).toBe(DEFAULT_PRIORITY);
    expect(isProviderTouched(state, "AWS")).toBe(false);
  });

  it("returns the explicit value once set", () => {
    const state = makeState({ providerPriorities: { AWS: 8 } });
    expect(getProviderPriority(state, "AWS")).toBe(8);
    expect(isProviderTouched(state, "AWS")).toBe(true);
  });
});

describe("effective priority cascade", () => {
  it("cert override wins over everything else", () => {
    const cert = makeCert({ id: "c1", provider: "AWS" });
    const state = makeState({ providerPriorities: { AWS: 8 }, certOverrides: { c1: 2 } });
    expect(getCertOverride(state, "c1")).toBe(2);
    expect(getEffectivePriority(state, cert)).toBe(2);
  });

  it("falls back to provider priority when the provider has been touched", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState({ providerPriorities: { AWS: 8 } });
    // even though a suggestion would otherwise be computable, a touched provider wins
    expect(getEffectivePriority(state, cert)).toBe(8);
  });

  it("falls back to the automatic suggestion when nothing is touched and it is computable", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 9 } }); // 90% -> tier 9
    expect(getEffectivePriority(state, cert)).toBe(9);
  });

  it("falls back to the default 5 when nothing is touched and no suggestion is computable", () => {
    const cert = makeCert({ id: "c1", provider: "AWS" });
    const state = makeState();
    expect(getEffectivePriority(state, cert)).toBe(DEFAULT_PRIORITY);
  });
});

describe("getSuggestedPriority: ratio = objectif fixe / objectif global (quota)", () => {
  const quota = 100;

  function suggestedFor(targetPct: number) {
    const cert = makeCert({ id: "c1", objective: { quota, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: targetPct } }); // targetPct also = ratio*100 since quota=100
    return getSuggestedPriority(state, cert);
  }

  it("< 20% -> no suggestion (null)", () => {
    expect(suggestedFor(0)).toBeNull();
    expect(suggestedFor(19)).toBeNull();
  });

  it("20% to 39% -> 6", () => {
    expect(suggestedFor(20)).toBe(6);
    expect(suggestedFor(39)).toBe(6);
  });

  it("40% to 55% -> 7", () => {
    expect(suggestedFor(40)).toBe(7);
    expect(suggestedFor(55)).toBe(7);
  });

  it("just above 55% to 75% -> 8", () => {
    expect(suggestedFor(56)).toBe(8);
    expect(suggestedFor(75)).toBe(8);
  });

  it("just above 75% to 90% -> 9", () => {
    expect(suggestedFor(76)).toBe(9);
    expect(suggestedFor(90)).toBe(9);
  });

  it("just above 90% -> 10", () => {
    expect(suggestedFor(91)).toBe(10);
    expect(suggestedFor(100)).toBe(10);
  });

  it("returns null when the quota (objectif global) is unknown", () => {
    const cert = makeCert({ id: "c1", objective: { quota: null, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 9 } });
    expect(getSuggestedPriority(state, cert)).toBeNull();
  });

  it("returns null when there is no source quota at all (nothing to compare against)", () => {
    const cert = makeCert({ id: "c1", objective: { quota: null, obtenu: 0, enCours: null } });
    const state = makeState();
    expect(getSuggestedPriority(state, cert)).toBeNull();
  });

  // NB: comportement herite fidelement du prototype HTML, a confirmer avec Antoine (cf. rapport
  // de migration) : sans override, l'objectif fixe herite exactement du quota source
  // (getEffectiveTarget), donc le ratio vaut toujours 100% -> priorite suggeree = 10 des qu'un
  // quota existe, meme sans aucune decision COMEX. C'est probablement une surprise plus qu'un
  // choix delibere : personne n'avait teste l'etat "jamais touche" apres le changement de
  // formule (objectif fixe / objectif global) fait plus tot dans le projet.
  it("suggests the maximum tier (10) by default once a quota exists, even with zero interaction", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState();
    expect(getSuggestedPriority(state, cert)).toBe(10);
  });
});

describe("isPrioritySuggested", () => {
  it("is true only when neither the cert nor the provider has a manual decision, and a suggestion exists", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 9 } });
    expect(isPrioritySuggested(state, cert)).toBe(true);
  });

  it("is false once a manual cert override exists", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 9 }, certOverrides: { c1: 2 } });
    expect(isPrioritySuggested(state, cert)).toBe(false);
  });

  it("is false once the provider has a manual priority, even if the cert itself is untouched", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 9 }, providerPriorities: { AWS: 4 } });
    expect(isPrioritySuggested(state, cert)).toBe(false);
  });
});
