import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_APPEARANCE,
  applyAppearance,
  getSystemTheme,
  readAppearance,
  subscribeToSystemTheme,
  writeAppearance,
  resolveTheme,
} from "../../shared/storage/appearance";
import { AppearanceContext } from "../../shared/appearance/appearanceContext";

/**
 * Provee tema (claro/oscuro/automático) y tamaño de letra.
 *
 * Mantiene `<html data-theme data-font-size>` sincronizado, escucha al tema
 * del sistema cuando el modo es `auto` y persiste cada cambio en localStorage.
 */
export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(readAppearance);
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, () => "light");
  const resolvedTheme = resolveTheme(appearance.theme, systemTheme);

  useEffect(() => {
    applyAppearance(appearance, systemTheme);
    writeAppearance(appearance);
  }, [appearance, systemTheme]);

  const setTheme = useCallback((theme) => {
    setAppearance((previous) => ({ ...previous, theme }));
  }, []);

  const setFontSize = useCallback((fontSize) => {
    setAppearance((previous) => ({ ...previous, fontSize }));
  }, []);

  const resetAppearance = useCallback(() => {
    setAppearance({ ...DEFAULT_APPEARANCE });
  }, []);

  const value = useMemo(
    () => ({
      theme: appearance.theme,
      fontSize: appearance.fontSize,
      resolvedTheme,
      setTheme,
      setFontSize,
      resetAppearance,
    }),
    [appearance.theme, appearance.fontSize, resolvedTheme, setTheme, setFontSize, resetAppearance],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export default ThemeProvider;
