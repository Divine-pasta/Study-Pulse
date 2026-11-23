import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.max(width, height) >= 768;
  const isWideTablet = isTablet && isLandscape;

  // Cap content width on wide landscape tablets so lines stay readable
  const contentMaxWidth = isWideTablet ? 1040 : isTablet ? 820 : undefined;
  const horizontalPadding = isTablet ? 24 : 18;
  const subjectColumns = isWideTablet ? 2 : 1;
  const breakdownColumns = width >= 600 ? 2 : 1;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isWideTablet,
    contentMaxWidth,
    horizontalPadding,
    subjectColumns,
    breakdownColumns,
  };
}
