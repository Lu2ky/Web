import { createContext, useContext } from "react";
import { DEFAULT_APPEARANCE } from "../storage/appearance";

export const AppearanceContext = createContext({
  ...DEFAULT_APPEARANCE,
  resolvedTheme: "light",
  setTheme: () => {},
  setFontSize: () => {},
  resetAppearance: () => {},
});

export function useAppearance() {
  return useContext(AppearanceContext);
}
