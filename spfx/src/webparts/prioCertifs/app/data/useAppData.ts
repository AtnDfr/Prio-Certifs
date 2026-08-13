import { useEffect, useState } from "react";
import type { AppData } from "../domain/types";
import type { DataRepository } from "./DataRepository";

type AppDataState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: AppData };

/** Charge le catalogue via l'interface DataRepository, quelle que soit son implementation. */
export function useAppData(repository: DataRepository): AppDataState {
  const [state, setState] = useState<AppDataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    repository
      .getAppData()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", error });
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  return state;
}
