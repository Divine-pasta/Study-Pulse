import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabKey } from '../types';
import { useTheme } from '../theme/ThemeContext';

interface FloatingNavDockProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingTodoCount: number;
}

interface TabConfig {
  key: TabKey;
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'syllabus', label: 'Syllabus', iconOutline: 'book-outline', iconFilled: 'book' },
  { key: 'countdown', label: 'Countdown', iconOutline: 'hourglass-outline', iconFilled: 'hourglass' },
  { key: 'todo', label: 'To-Do', iconOutline: 'checkbox-outline', iconFilled: 'checkbox' },
];

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  activeTab,
  onSelectTab,
  pendingTodoCount,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [innerWidth, setInnerWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.key === activeTab)
  );
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      damping: 20,
      stiffness: 210,
      mass: 0.8,
    }).start();
  }, [activeIndex, slideAnim]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setInnerWidth(e.nativeEvent.layout.width);
  };

  const pillWidth = innerWidth > 0 ? innerWidth / TABS.length : 0;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, pillWidth, pillWidth * 2],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + 6 }]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: colors.navDockFill,
            borderTopColor: colors.specularTopBorder,
            borderLeftColor: colors.specularTopBorder,
            borderRightColor: colors.specularSideBorder,
            borderBottomColor: colors.specularSideBorder,
          },
          mode === 'light' && styles.lightShadow,
        ]}
      >
        <LinearGradient
          colors={colors.sheenColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
        />

        <View style={styles.track} onLayout={handleLayout}>
          {pillWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingPill,
                {
                  width: pillWidth,
                  backgroundColor: colors.navPillActive,
                  borderColor: colors.specularTopBorder,
                  transform: [{ translateX }],
                },
              ]}
            />
          )}

          {TABS.map((tab) => {
            const focused = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onSelectTab(tab.key)}
                style={styles.tabBtn}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={focused ? tab.iconFilled : tab.iconOutline}
                    size={19}
                    color={focused ? colors.accentPrimary : colors.textSecondary}
                  />
                  {tab.key === 'todo' && pendingTodoCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.accentSecondary }]}>
                      <Text style={styles.badgeText}>
                        {pendingTodoCount > 9 ? '9+' : pendingTodoCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: focused ? colors.accentPrimary : colors.textSecondary,
                      fontWeight: focused ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  dock: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 999,
    borderWidth: 1,
    padding: 5,
    overflow: 'hidden',
  },
  lightShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
});

