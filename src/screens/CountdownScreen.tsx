import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { GlassModal } from '../components/GlassModal';
import { CalendarPicker } from '../components/CalendarPicker';
import { CourseSyllabus, MilestoneItem } from '../types';
import { createId } from '../data/syllabusTemplates';

interface CountdownScreenProps {
  activeCourse: CourseSyllabus;
  milestones: MilestoneItem[];
  onChangeExamDate: (newDateISO: string) => void;
  onAddMilestone: (milestone: MilestoneItem) => void;
  onDeleteMilestone: (id: string) => void;
}

function parseLocalEndOfTarget(iso: string): Date {
  const parts = iso.split('-').map((n) => parseInt(n, 10));
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    // Target exam morning at 09:00 local time
    return new Date(parts[0], parts[1] - 1, parts[2], 9, 0, 0, 0);
  }
  return new Date();
}

function computeRemaining(iso: string, nowMs: number): {
  status: 'FUTURE' | 'TODAY' | 'PASSED';
  days: number;
  hours: number;
  totalDaysCeil: number;
} {
  const target = parseLocalEndOfTarget(iso);
  const diffMs = target.getTime() - nowMs;

  const today = new Date(nowMs);
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;

  if (iso === todayISO) {
    const hoursLeftToday = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    return { status: 'TODAY', days: 0, hours: hoursLeftToday, totalDaysCeil: 1 };
  }

  if (diffMs <= 0) {
    return { status: 'PASSED', days: 0, hours: 0, totalDaysCeil: 0 };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const totalDaysCeil = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return { status: 'FUTURE', days, hours, totalDaysCeil };
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  activeCourse,
  milestones,
  onChangeExamDate,
  onAddMilestone,
  onDeleteMilestone,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState(activeCourse.examDateISO);

  // Update every 30 seconds for accurate live hours without unnecessary battery drain
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const remainingTopics = useMemo(() => {
    let rem = 0;
    for (const s of activeCourse.subjects) {
      for (const c of s.chapters) {
        for (const t of c.topics) {
          if (!t.completed) rem += 1;
        }
      }
    }
    return rem;
  }, [activeCourse]);

  const countdown = useMemo(
    () => computeRemaining(activeCourse.examDateISO, nowMs),
    [activeCourse.examDateISO, nowMs]
  );

  const topicsPerDay = useMemo(() => {
    if (remainingTopics === 0) return '0.0';
    if (countdown.totalDaysCeil <= 0) return `${remainingTopics}`;
    return (remainingTopics / countdown.totalDaysCeil).toFixed(1);
  }, [remainingTopics, countdown.totalDaysCeil]);

  const courseMilestones = useMemo(
    () =>
      milestones
        .filter((m) => m.courseId === activeCourse.id)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [milestones, activeCourse.id]
  );

  const highlightedCalendarDates = useMemo(
    () => courseMilestones.map((m) => m.dateISO),
    [courseMilestones]
  );

  const handleSaveMilestone = () => {
    const trimmed = milestoneTitle.trim();
    if (!trimmed) return;
    onAddMilestone({
      id: createId('ms'),
      title: trimmed,
      dateISO: milestoneDate,
      courseId: activeCourse.id,
    });
    setMilestoneTitle('');
    setMilestoneModalOpen(false);
  };

  return (
    <View style={styles.flex1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 92 },
        ]}
      >
        {/* Live Countdown Hero Card */}
        <GlassCard elevated style={styles.heroCard}>
          <View style={styles.topMetaRow}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
              EXAM COUNTDOWN
            </Text>
            <View style={[styles.dateChip, { backgroundColor: colors.accentPrimarySoft }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.accentPrimary} />
              <Text style={[styles.dateChipText, { color: colors.accentPrimary }]}>
                {activeCourse.examDateISO}
              </Text>
            </View>
          </View>

          {countdown.status === 'TODAY' ? (
            <View style={styles.statusBanner}>
              <Text style={[styles.statusHeadline, { color: colors.accentSecondary }]}>
                Exam Day is Today!
              </Text>
              <Text style={[styles.statusSub, { color: colors.textSecondary }]}>
                Stay calm, trust your preparation, and execute cleanly.
              </Text>
            </View>
          ) : countdown.status === 'PASSED' ? (
            <View style={styles.statusBanner}>
              <Text style={[styles.statusHeadline, { color: colors.warning }]}>
                Target Date Passed
              </Text>
              <Text style={[styles.statusSub, { color: colors.textSecondary }]}>
                Pick a new target date on the calendar below to reset your countdown.
              </Text>
            </View>
          ) : (
            <View style={styles.timerRow}>
              <View style={[styles.timeBox, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.timeNumber, { color: colors.accentPrimary }]}>
                  {String(countdown.days).padStart(2, '0')}
                </Text>
                <Text style={[styles.timeUnit, { color: colors.textSecondary }]}>DAYS</Text>
              </View>

              <Text style={[styles.colon, { color: colors.textMuted }]}>:</Text>

              <View style={[styles.timeBox, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.timeNumber, { color: colors.accentSecondary }]}>
                  {String(countdown.hours).padStart(2, '0')}
                </Text>
                <Text style={[styles.timeUnit, { color: colors.textSecondary }]}>HOURS</Text>
              </View>
            </View>
          )}

          {/* Pacing Estimate Bar */}
          <View style={[styles.pacingBox, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="speedometer-outline" size={18} color={colors.accentPrimary} />
            <Text style={[styles.pacingText, { color: colors.textPrimary }]}>
              {remainingTopics === 0
                ? 'All syllabus topics completed! Focus on revision & mock tests.'
                : countdown.status === 'PASSED'
                ? `${remainingTopics} syllabus topics still remaining.`
                : `Pacing target: ~${topicsPerDay} topics/day (${remainingTopics} remaining)`}
            </Text>
          </View>
        </GlassCard>

        {/* Interactive Exam Date Picker Card */}
        <GlassCard style={styles.cardSpacing}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Select Primary Exam Date
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Tap any date below to update {activeCourse.name}. Green dots mark your milestones.
          </Text>
          <CalendarPicker
            selectedDateISO={activeCourse.examDateISO}
            onSelectDate={onChangeExamDate}
            highlightedDates={highlightedCalendarDates}
          />
        </GlassCard>

        {/* Secondary Milestones & Mock Tests */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Milestones & Mock Exams
          </Text>
          <Pressable
            onPress={() => {
              setMilestoneDate(activeCourse.examDateISO);
              setMilestoneModalOpen(true);
            }}
            style={[
              styles.addBtn,
              {
                backgroundColor: colors.accentSecondarySoft,
                borderColor: colors.accentSecondary,
              },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.accentSecondary} />
            <Text style={[styles.addBtnText, { color: colors.accentSecondary }]}>Add Date</Text>
          </Pressable>
        </View>

        {courseMilestones.length === 0 ? (
          <GlassCard>
            <Text style={[styles.emptyMilestone, { color: colors.textSecondary }]}>
              No mock test or revision deadlines added yet. Tap "Add Date" to track checkpoints.
            </Text>
          </GlassCard>
        ) : (
          courseMilestones.map((item) => {
            const info = computeRemaining(item.dateISO, nowMs);
            return (
              <GlassCard key={item.id} style={styles.milestoneCard} contentStyle={styles.msRow}>
                <View style={styles.flex1}>
                  <Text style={[styles.msTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.msDate, { color: colors.textSecondary }]}>
                    {item.dateISO}
                  </Text>
                </View>

                <View style={[styles.msBadge, { backgroundColor: colors.accentPrimarySoft }]}>
                  <Text style={[styles.msBadgeText, { color: colors.accentPrimary }]}>
                    {info.status === 'TODAY'
                      ? 'Today'
                      : info.status === 'PASSED'
                      ? 'Done'
                      : `${info.days}d ${info.hours}h`}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onDeleteMilestone(item.id)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Add Milestone Modal */}
      <GlassModal
        visible={milestoneModalOpen}
        title="Add Milestone / Mock Exam"
        onClose={() => setMilestoneModalOpen(false)}
      >
        <TextInput
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          placeholder="e.g., Full Syllabus Mock Test #1"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBg,
              borderColor: colors.divider,
            },
          ]}
        />
        <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
          Selected Date: {milestoneDate}
        </Text>
        <CalendarPicker selectedDateISO={milestoneDate} onSelectDate={setMilestoneDate} />

        <Pressable
          onPress={handleSaveMilestone}
          disabled={!milestoneTitle.trim()}
          style={[
            styles.saveMsBtn,
            {
              backgroundColor: milestoneTitle.trim() ? colors.accentPrimary : colors.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.saveMsText,
              { color: milestoneTitle.trim() ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            Save Milestone
          </Text>
        </Pressable>
      </GlassModal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  heroCard: {
    marginBottom: 14,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  timeBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 38,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timeUnit: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  colon: {
    fontSize: 28,
    fontWeight: '800',
  },
  statusBanner: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusHeadline: {
    fontSize: 22,
    fontWeight: '800',
  },
  statusSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  pacingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  pacingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  cardSpacing: {
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyMilestone: {
    fontSize: 13,
    lineHeight: 19,
  },
  milestoneCard: {
    marginBottom: 10,
  },
  msRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  msTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  msDate: {
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  msBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  msBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    padding: 4,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  saveMsBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveMsText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

