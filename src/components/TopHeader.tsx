import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface TopHeaderProps {
  studentName: string;
  activeCourseName: string;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  studentName,
  activeCourseName,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.identityBlock}>
        <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={1}>
          Hi, {studentName}
        </Text>
        <View
          style={[
            styles.examBadge,
            {
              backgroundColor: colors.accentPrimarySoft,
              borderColor: colors.specularTopBorder,
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: colors.accentPrimary }]} />
          <Text style={[styles.examBadgeText, { color: colors.accentPrimary }]} numberOfLines={1}>
            {activeCourseName}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={toggleTheme}
          accessibilityLabel="Toggle AMOLED Dark or Light Theme"
          style={[
            styles.iconPill,
            {
              backgroundColor: colors.glassFill,
              borderColor: colors.specularTopBorder,
            },
          ]}
        >
          <Ionicons
            name={mode === 'dark' ? 'sunny' : 'moon'}
            size={17}
            color={mode === 'dark' ? colors.warning : colors.accentPrimary}
          />
          <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
            {mode === 'dark' ? 'AMOLED' : 'Light'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenSettings}
          accessibilityLabel="Open Settings"
          style={[
            styles.circleBtn,
            {
              backgroundColor: colors.glassFill,
              borderColor: colors.specularTopBorder,
            },
          ]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  identityBlock: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  examBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  examBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

