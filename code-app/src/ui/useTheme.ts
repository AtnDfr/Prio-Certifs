import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "prioCertifsWavestone_theme";
type Theme = "light" | "dark";

function readSaved(): Theme | null {
  try {
    return localStorage.getItem(THEME_KEY) as Theme | null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(() => readSaved());

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
