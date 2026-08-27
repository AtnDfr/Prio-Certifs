import { providerStats } from "./providerStats";
import { makeCert, makeState } from "./testFixtures";
import type { AppData } from "./types";

function dataWith(...certs: ReturnType<typeof makeCert>[]): AppData {
  return { certifications: certs, providers: Array.from(new Set(certs.map((c) => c.provider))) };
}

describe("providerStats", () => {
  it("aggregates certified/quota from the source quota, unaffected by an objectif-fixe override", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 1, enCours: null } });
    const data = dataWith(cert);
    // COMEX raises the objectif fixe way above the source quota (the exact scenario that used
    // to leak into the "Certifiés" ratio before the fix).
    const state = makeState({ certTargets: { c1: 90 } });

    const stats = providerStats(state, data, "AWS");
    expect(stats.quota).toBe(10); // toujours la capacite source, jamais l'objectif fixe
    expect(stats.obtenu).toBe(1);
    expect(stats.obtenuKnownCount).toBe(1);
  });

  it("does not count certs with an unknown source quota in the certified aggregate", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: null, obtenu: 1, enCours: null } });
    const data = dataWith(cert);
    const stats = providerStats(makeState(), data, "AWS");
    expect(stats.obtenuKnownCount).toBe(0);
    expect(stats.quota).toBe(0);
    expect(stats.obtenu).toBe(0);
  });

  it("computes gap from the objectif-fixe subset (target defined + obtenu known)", () => {
    const withTarget = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 3, enCours: null } });
    const withoutTarget = makeCert({ id: "c2", provider: "AWS", objective: { quota: null, obtenu: 2, enCours: null } });
    const data = dataWith(withTarget, withoutTarget);
    const stats = providerStats(makeState(), data, "AWS");
    expect(stats.targetDefinedCount).toBe(1); // seule c1 a un objectif fixe (herite du quota)
    expect(stats.gap).toBe(7); // 10 - 3, c2 est hors de cet agregat
  });

  it("reports the provider priority and whether it has been manually touched", () => {
    const data = dataWith(makeCert({ id: "c1", provider: "AWS" }));
    expect(providerStats(makeState(), data, "AWS").touched).toBe(false);
    expect(providerStats(makeState(), data, "AWS").priority).toBe(5);
    const touched = providerStats(makeState({ providerPriorities: { AWS: 9 } }), data, "AWS");
    expect(touched.touched).toBe(true);
    expect(touched.priority).toBe(9);
  });
});
