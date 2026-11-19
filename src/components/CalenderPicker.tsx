import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface CalendarPickerProps {
  selectedDateISO: string; // YYYY-MM-DD
  onSelectDate: (iso: string) => void;
  highlightedDates?: string[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseISO(iso: string): { year: number; month: number; day: number } {
  const parts = iso.split('-').map((n) => parseInt(n, 10));
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDateISO,
  onSelectDate,
  highlightedDates = [],
}) => {
  const { colors } = useTheme();
  const parsed = useMemo(() => parseISO(selectedDateISO), [selectedDateISO]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  const todayISO = useMemo(() => {
    const now = new Date();
    return toISO(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const highlightSet = useMemo(() => new Set(highlightedDates), [highlightedDates]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: Array<{ key: string; day: number | null; iso: string | null }> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      list.push({ key: `blank_${i}`, day: null, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({ key: `day_${d}`, day: d, iso: toISO(viewYear, viewMonth, d) });
    }
    while (list.length % 7 !== 0) {
      list.push({ key: `tail_${list.length}`, day: null, iso: null });
    }
    return list;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthBar}>
        <Pressable
          onPress={goPrevMonth}
          style={[styles.navBtn, { backgroundColor: colors.inputBg }]}
          accessibilityLabel="Previous Month"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>

        <Pressable
          onPress={goNextMonth}
          style={[styles.navBtn, { backgroundColor: colors.inputBg }]}
          accessibilityLabel="Next Month"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((dayName) => (
          <Text key={dayName} style={[styles.weekdayText, { color: colors.textMuted }]}>
            {dayName}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.day || !cell.iso) {
            return <View key={cell.key} style={styles.dayCell} />;
          }

          const isSelected = cell.iso === selectedDateISO;
          const isToday = cell.iso === todayISO;
          const isMilestone = highlightSet.has(cell.iso);

          return (
            <Pressable
              key={cell.key}
              onPress={() => onSelectDate(cell.iso!)}
              style={[
                styles.dayCell,
                isSelected && {
                  backgroundColor: colors.accentPrimary,
                  borderRadius: 12,
                },
                !isSelected &&
                  isToday && {
                    borderWidth: 1,
                    borderColor: colors.accentPrimary,
                    borderRadius: 12,
                  },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                      ? colors.accentPrimary
                      : colors.textPrimary,
                    fontWeight: isSelected || isToday ? '800' : '500',
                  },
                ]}
              >
                {cell.day}
              </Text>
              {isMilestone && (
                <View
                  style={[
                    styles.milestoneDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : colors.accentSecondary },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  milestoneDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
});

