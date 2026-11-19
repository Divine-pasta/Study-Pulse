import { ThemeMode } from '../types';

export interface ThemePalette {
  mode: ThemeMode;
  canvas: string;
  glassFill: string;
  glassFillElevated: string;
  navDockFill: string;
  navPillActive: string;
  specularTopBorder: string;
  specularSideBorder: string;
  sheenColors: readonly [string, string, string];
  ambientGlowColors: readonly [string, string, string];
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentPrimarySoft: string;
  accentSecondary: string;
  accentSecondarySoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  inputBg: string;
  divider: string;
  modalScrim: string;
}

export const DARK_PALETTE: ThemePalette = {
  mode: 'dark',
  canvas: '#000000',
  glassFill: 'rgba(13, 17, 23, 0.88)',
  glassFillElevated: 'rgba(18, 24, 33, 0.94)',
  navDockFill: 'rgba(14, 18, 26, 0.95)',
  navPillActive: 'rgba(56, 189, 248, 0.18)',
  specularTopBorder: 'rgba(255, 255, 255, 0.18)',
  specularSideBorder: 'rgba(255, 255, 255, 0.08)',
  sheenColors: [
    'rgba(255, 255, 255, 0.07)',
    'rgba(255, 255, 255, 0.015)',
    'rgba(255, 255, 255, 0.0)',
  ] as const,
  ambientGlowColors: [
    'rgba(56, 189, 248, 0.22)',
    'rgba(52, 211, 153, 0.08)',
    'rgba(0, 0, 0, 0.0)',
  ] as const,
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accentPrimary: '#38BDF8',
  accentPrimarySoft: 'rgba(56, 189, 248, 0.14)',
  accentSecondary: '#34D399',
  accentSecondarySoft: 'rgba(52, 211, 153, 0.14)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  warning: '#FBBF24',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.08)',
  modalScrim: 'rgba(0, 0, 0, 0.85)',
};

export const LIGHT_PALETTE: ThemePalette = {
  mode: 'light',
  canvas: '#F1F5F9',
  glassFill: 'rgba(255, 255, 255, 0.86)',
  glassFillElevated: 'rgba(255, 255, 255, 0.96)',
  navDockFill: 'rgba(255, 255, 255, 0.94)',
  navPillActive: 'rgba(37, 99, 235, 0.12)',
  specularTopBorder: 'rgba(255, 255, 255, 0.95)',
  specularSideBorder: 'rgba(15, 23, 42, 0.08)',
  sheenColors: [
    'rgba(255, 255, 255, 0.65)',
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.0)',
  ] as const,
  ambientGlowColors: [
    'rgba(37, 99, 235, 0.16)',
    'rgba(5, 150, 105, 0.08)',
    'rgba(241, 245, 249, 0.0)',
  ] as const,
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accentPrimary: '#2563EB',
  accentPrimarySoft: 'rgba(37, 99, 235, 0.10)',
  accentSecondary: '#059669',
  accentSecondarySoft: 'rgba(5, 150, 105, 0.10)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.10)',
  warning: '#D97706',
  inputBg: 'rgba(15, 23, 42, 0.05)',
  divider: 'rgba(15, 23, 42, 0.08)',
  modalScrim: 'rgba(0, 0, 0, 0.85)',
};

