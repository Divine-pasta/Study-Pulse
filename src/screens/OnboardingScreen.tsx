import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassCard } from '../components/GlassCard';
import { CalendarPicker } from '../components/CalendarPicker';
import {
  cloneTemplateSyllabus,
  EXAM_PRESETS,
  getFutureDateISO,
} from '../data/syllabusTemplates';
import { CourseSyllabus, ExamPresetKey, StudentProfile } from '../types';

interface OnboardingScreenProps {
  onCompleteOnboarding: (profile: StudentProfile, initialCourse: CourseSyllabus) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onCompleteOnboarding }) => {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useTheme();

  const [studentName, setStudentName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ExamPresetKey>('NEET');
  const [customCourseName, setCustomCourseName] = useState('');
  const [examDateISO, setExamDateISO] = useState<string>(() => getFutureDateISO(150));
  const [usePreloaded, setUsePreloaded] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (preset: ExamPresetKey) => {
    setSelectedPreset(preset);
    const found = EXAM_PRESETS.find((p) => p.key === preset);
    if (found) {
      setExamDateISO(getFutureDateISO(found.defaultOffsetDays));
    }
    if (preset === 'CUSTOM') {
      setUsePreloaded(false);
    }
  };

  const handleFinish = () => {
    const trimmedName = studentName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter your name to personalize your study workspace.');
      return;
    }

    const presetMeta = EXAM_PRESETS.find((p) => p.key === selectedPreset) ?? EXAM_PRESETS[0];
    const resolvedCourseName =
      selectedPreset === 'CUSTOM'
        ? customCourseName.trim() || 'Custom Exam'
        : customCourseName.trim() || presetMeta.label;

    const course = cloneTemplateSyllabus(
      selectedPreset,
      resolvedCourseName,
      examDateISO,
      selectedPreset !== 'CUSTOM' && usePreloaded
    );

    const profile: StudentProfile = {
      name: trimmedName,
      activeCourseId: course.id,
      onboarded: true,
    };

    onCompleteOnboarding(profile, course);
  };

  return (
    <AmbientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 12,
              paddingBottom: Math.max(insets.bottom, 20) + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand & Theme Switch */}
          <View style={styles.topRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={16} color={colors.accentPrimary} />
              <Text style={[styles.brandText, { color: colors.accentPrimary }]}>STUDYPULSE</Text>
            </View>
            <Pressable
              onPress={toggleTheme}
              style={[
                styles.themeBtn,
                { backgroundColor: colors.glassFill, borderColor: colors.specularTopBorder },
              ]}
            >
              <Ionicons
                name={mode === 'dark' ? 'sunny' : 'moon'}
                size={15}
                color={mode === 'dark' ? colors.warning : colors.accentPrimary}
              />
              <Text style={[styles.themeBtnText, { color: colors.textSecondary }]}>
                {mode === 'dark' ? 'AMOLED' : 'Light'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Set Up Your Offline Study Hub
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Zero cloud accounts. Everything stays fast and private on your device.
          </Text>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Step 1: Student Name */}
          <GlassCard style={styles.cardSpacing}>
            <Text style={[styles.stepLabel, { color: colors.accentPrimary }]}>STEP 1</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              What should we call you?
            </Text>
            <TextInput
              value={studentName}
              onChangeText={(t) => {
                setStudentName(t);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter your first name (e.g., Aarav)"
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
          </GlassCard>

          {/* Step 2: Target Exam / Course */}
          <GlassCard style={styles.cardSpacing}>
            <Text style={[styles.stepLabel, { color: colors.accentPrimary }]}>STEP 2</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Target Exam or Course
            </Text>
            <View style={styles.presetGrid}>
              {EXAM_PRESETS.map((preset) => {
                const active = preset.key === selectedPreset;
                return (
                  <Pressable
                    key={preset.key}
                    onPress={() => handleSelectPreset(preset.key)}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: active ? colors.accentPrimarySoft : colors.inputBg,
                        borderColor: active ? colors.accentPrimary : colors.divider,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetTitle,
                        { color: active ? colors.accentPrimary : colors.textPrimary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={[styles.presetSub, { color: colors.textSecondary }]}>
                      {preset.subtitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={customCourseName}
              onChangeText={setCustomCourseName}
              placeholder={
                selectedPreset === 'CUSTOM'
                  ? 'Enter your exam/course name (e.g., GATE CS 2027)'
                  : 'Optional custom label (leave blank to use preset name)'
              }
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  marginTop: 10,
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.divider,
                },
              ]}
            />
          </GlassCard>

          {/* Step 3: Primary Exam Date */}
          <GlassCard style={styles.cardSpacing}>
            <View style={styles.dateHeader}>
              <View>
                <Text style={[styles.stepLabel, { color: colors.accentPrimary }]}>STEP 3</Text>
                <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                  Primary Exam Date
                </Text>
              </View>
              <View style={[styles.datePill, { backgroundColor: colors.accentSecondarySoft }]}>
                <Text style={[styles.datePillText, { color: colors.accentSecondary }]}>
                  {examDateISO}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <CalendarPicker selectedDateISO={examDateISO} onSelectDate={setExamDateISO} />
            </View>
          </GlassCard>

          {/* Step 4: Syllabus Setup Choice */}
          <GlassCard style={styles.cardSpacing}>
            <Text style={[styles.stepLabel, { color: colors.accentPrimary }]}>STEP 4</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Syllabus Starting Point
            </Text>

            <Pressable
              disabled={selectedPreset === 'CUSTOM'}
              onPress={() => setUsePreloaded(true)}
              style={[
                styles.choiceCard,
                {
                  backgroundColor:
                    usePreloaded && selectedPreset !== 'CUSTOM'
                      ? colors.accentPrimarySoft
                      : colors.inputBg,
                  borderColor:
                    usePreloaded && selectedPreset !== 'CUSTOM'
                      ? colors.accentPrimary
                      : colors.divider,
                  opacity: selectedPreset === 'CUSTOM' ? 0.45 : 1,
                },
              ]}
            >
              <Ionicons
                name={
                  usePreloaded && selectedPreset !== 'CUSTOM'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={20}
                color={colors.accentPrimary}
              />
              <View style={styles.flex1}>
                <Text style={[styles.choiceTitle, { color: colors.textPrimary }]}>
                  Preloaded Syllabus Template
                </Text>
                <Text style={[styles.choiceSub, { color: colors.textSecondary }]}>
                  Clone bundled subjects, chapters & topics into editable local storage.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setUsePreloaded(false)}
              style={[
                styles.choiceCard,
                {
                  marginTop: 10,
                  backgroundColor:
                    !usePreloaded || selectedPreset === 'CUSTOM'
                      ? colors.accentPrimarySoft
                      : colors.inputBg,
                  borderColor:
                    !usePreloaded || selectedPreset === 'CUSTOM'
                      ? colors.accentPrimary
                      : colors.divider,
                },
              ]}
            >
              <Ionicons
                name={
                  !usePreloaded || selectedPreset === 'CUSTOM'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={20}
                color={colors.accentPrimary}
              />
              <View style={styles.flex1}>
                <Text style={[styles.choiceTitle, { color: colors.textPrimary }]}>
                  Start with Custom Empty Syllabus
                </Text>
                <Text style={[styles.choiceSub, { color: colors.textSecondary }]}>
                  Build your own subjects, chapters & topics from scratch.
                </Text>
              </View>
            </Pressable>
          </GlassCard>

          <Pressable
            onPress={handleFinish}
            style={[styles.launchBtn, { backgroundColor: colors.accentPrimary }]}
          >
            <Text style={styles.launchBtnText}>Launch Study Workspace</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AmbientBackground>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardSpacing: {
    marginBottom: 14,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  presetGrid: {
    gap: 8,
  },
  presetCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  choiceSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  launchBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

