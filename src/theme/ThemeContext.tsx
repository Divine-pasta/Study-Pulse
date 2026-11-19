import React, { createContext, useContext, useMemo } from 'react';
import { ThemeMode } from '../types';
import { DARK_PALETTE, LIGHT_PALETTE, ThemePalette } from './colors';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemePalette;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: DARK_PALETTE,
  toggleTheme: () => undefined,
  setTheme: () => undefined,
});

interface ThemeProviderProps {
  mode: ThemeMode;
  onChangeMode: (next: ThemeMode) => void;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  mode,
  onChangeMode,
  children,
}) => {
  const value = useMemo<ThemeContextValue>(() => {
    const colors = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
    return {
      mode,
      colors,
      toggleTheme: () => onChangeMode(mode === 'dark' ? 'light' : 'dark'),
      setTheme: onChangeMode,
    };
  }, [mode, onChangeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

