import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { emptyState, type AppData, type CertPrioritizationState } from "../domain/types";
import type { StateRepository } from "../data/StateRepository";

type CertPrioritizationActions = {
  setProviderPriority: (provider: string, value: number) => void;
  setCertOverride: (certId: string, value: number) => void;
  /** Revient a l'heritage du fournisseur (supprime l'exception, ne met pas null). */
  clearCertOverride: (certId: string) => void;
  setCertTarget: (certId: string, value: number) => void;
  /** Decision explicite "pas d'objectif", tri-etat distinct de l'absence (cf. domain/objectives.ts). */
  clearCertTarget: (certId: string) => void;
  resetAll: () => void;
};

type CertPrioritizationValue = { state: CertPrioritizationState } & CertPrioritizationActions;

const CertPrioritizationCtx = createContext<CertPrioritizationValue | undefined>(undefined);

type Props = {
  /** Etat deja charge (SharePoint) avant montage — cf. app/App.tsx. */
  initialState: CertPrioritizationState;
  /** Necessaire pour ecrire les lignes SharePoint (une par certification). */
  data: AppData;
  stateRepository: StateRepository;
  children: React.ReactNode;
};

export function CertPrioritizationProvider({ initialState, data, stateRepository, children }: Props) {
  const [state, setState] = useState<CertPrioritizationState>(initialState);

  useEffect(() => {
    stateRepository.save(state, data);
  }, [state, data, stateRepository]);

  const setProviderPriority = useCallback((provider: string, value: number) => {
    setState((s) => ({ ...s, providerPriorities: { ...s.providerPriorities, [provider]: value } }));
  }, []);

  const setCertOverride = useCallback((certId: string, value: number) => {
    setState((s) => ({ ...s, certOverrides: { ...s.certOverrides, [certId]: value } }));
  }, []);

  const clearCertOverride = useCallback((certId: string) => {
    setState((s) => {
      const next = { ...s.certOverrides };
      delete next[certId];
      return { ...s, certOverrides: next };
    });
  }, []);

  const setCertTarget = useCallback((certId: string, value: number) => {
    setState((s) => ({ ...s, certTargets: { ...s.certTargets, [certId]: value } }));
  }, []);

  const clearCertTarget = useCallback((certId: string) => {
    setState((s) => ({ ...s, certTargets: { ...s.certTargets, [certId]: null } }));
  }, []);

  const resetAll = useCallback(() => {
    setState(emptyState());
  }, []);

  const value = useMemo<CertPrioritizationValue>(
    () => ({ state, setProviderPriority, setCertOverride, clearCertOverride, setCertTarget, clearCertTarget, resetAll }),
    [state, setProviderPriority, setCertOverride, clearCertOverride, setCertTarget, clearCertTarget, resetAll],
  );

  return <CertPrioritizationCtx.Provider value={value}>{children}</CertPrioritizationCtx.Provider>;
}

export function useCertPrioritization(): CertPrioritizationValue {
  const ctx = useContext(CertPrioritizationCtx);
  if (!ctx) throw new Error("useCertPrioritization must be used within a CertPrioritizationProvider");
  return ctx;
}
