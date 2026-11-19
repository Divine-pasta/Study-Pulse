import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  elevated?: boolean;
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  elevated = false,
  borderRadius = 20,
}) => {
  const { colors, mode } = useTheme();

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius,
          backgroundColor: elevated ? colors.glassFillElevated : colors.glassFill,
          borderTopColor: colors.specularTopBorder,
          borderLeftColor: colors.specularTopBorder,
          borderRightColor: colors.specularSideBorder,
          borderBottomColor: colors.specularSideBorder,
        },
        mode === 'light' && styles.lightShadow,
        style,
      ]}
    >
      <LinearGradient
        colors={colors.sheenColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    padding: 16,
  },
  lightShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

