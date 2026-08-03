import { describe, expect, it } from "vitest";
import { getCertStatus, getGap, getProjection, getResteAEngager } from "./derived";
import { makeCert, makeState } from "./testFixtures";

describe("getProjection", () => {
  it("is null unless both obtenu and enCours are known", () => {
    expect(getProjection(makeCert({ objective: { quota: null, obtenu: 5, enCours: null } }))).toBeNull();
    expect(getProjection(makeCert({ objective: { quota: null, obtenu: null, enCours: 2 } }))).toBeNull();
  });

  it("sums obtenu + enCours when both are known", () => {
    expect(getProjection(makeCert({ objective: { quota: null, obtenu: 5, enCours: 2 } }))).toBe(7);
  });
});

describe("getGap", () => {
  it("is null when the target or obtenu is unknown", () => {
    const cert = makeCert({ id: "c1", objective: { quota: null, obtenu: null, enCours: null } });
    expect(getGap(makeState(), cert)).toBeNull();
  });

  it("is the shortfall (never negative) between target and obtenu", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 3, enCours: null } });
    expect(getGap(makeState(), cert)).toBe(7);
    const overachieved = makeCert({ id: "c2", objective: { quota: 10, obtenu: 15, enCours: null } });
    expect(getGap(makeState(), overachieved)).toBe(0);
  });
});

describe("getResteAEngager", () => {
  it("is null when target or projection is unknown (dominant case today: enCours never known)", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 3, enCours: null } });
    expect(getResteAEngager(makeState(), cert)).toBeNull();
  });

  it("is target - projection, floored at 0, once enCours is known", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 3, enCours: 2 } });
    expect(getResteAEngager(makeState(), cert)).toBe(5);
  });
});

describe("getCertStatus", () => {
  it("is 'na' when target or projection is unknown", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 3, enCours: null } });
    expect(getCertStatus(makeState(), cert)).toBe("na");
  });

  it("is 'atteint' once the projection reaches the target", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 8, enCours: 2 } });
    expect(getCertStatus(makeState(), cert)).toBe("atteint");
  });

  it("is 'bonneVoie' when projection/target >= 60% but not yet reached", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 10, obtenu: 5, enCours: 1 } }); // 60%
    expect(getCertStatus(makeState(), cert)).toBe("bonneVoie");
  });

  it("is 'accelerer' below 60% when the effective priority is >= 7", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 1, enCours: 1 } }); // 20%
    const state = makeState({ providerPriorities: { AWS: 8 } });
    expect(getCertStatus(state, cert)).toBe("accelerer");
  });

  it("is 'bonneVoie' below 60% when the effective priority is < 7", () => {
    const cert = makeCert({ id: "c1", provider: "AWS", objective: { quota: 10, obtenu: 1, enCours: 1 } }); // 20%
    const state = makeState({ providerPriorities: { AWS: 3 } });
    expect(getCertStatus(state, cert)).toBe("bonneVoie");
  });
});
