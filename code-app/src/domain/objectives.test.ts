import { describe, expect, it } from "vitest";
import { getBaseTarget, getEffectiveTarget, getSourceEnCours, getSourceObtenu, isTargetOverridden } from "./objectives";
import { makeCert, makeState } from "./testFixtures";

describe("source data (read-only)", () => {
  it("returns null when obtenu/enCours/quota are absent", () => {
    const cert = makeCert();
    expect(getSourceObtenu(cert)).toBeNull();
    expect(getSourceEnCours(cert)).toBeNull();
    expect(getBaseTarget(cert)).toBeNull();
  });

  it("returns the raw source values when present", () => {
    const cert = makeCert({ objective: { quota: 40, obtenu: 5, enCours: 2 } });
    expect(getSourceObtenu(cert)).toBe(5);
    expect(getSourceEnCours(cert)).toBe(2);
    expect(getBaseTarget(cert)).toBe(40);
  });
});

describe("objectif fixe (decision COMEX, tri-etat)", () => {
  it("is not overridden when certTargets has no entry for this cert", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 20, obtenu: 0, enCours: null } });
    const state = makeState();
    expect(isTargetOverridden(state, cert)).toBe(false);
    expect(getEffectiveTarget(state, cert)).toBe(20); // herite du quota source
  });

  it("uses the explicit override number when set", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 20, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: 30 } });
    expect(isTargetOverridden(state, cert)).toBe(true);
    expect(getEffectiveTarget(state, cert)).toBe(30);
  });

  it("treats an explicit null as 'no objective', even over a source quota", () => {
    const cert = makeCert({ id: "c1", objective: { quota: 20, obtenu: 0, enCours: null } });
    const state = makeState({ certTargets: { c1: null } });
    expect(isTargetOverridden(state, cert)).toBe(true);
    expect(getEffectiveTarget(state, cert)).toBeNull();
  });

  it("has no target at all when there is neither a source quota nor an override", () => {
    const cert = makeCert({ id: "c1" });
    const state = makeState();
    expect(getEffectiveTarget(state, cert)).toBeNull();
  });
});
