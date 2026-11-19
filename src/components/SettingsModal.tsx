import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassModal } from './GlassModal';
import {
  AppBackupPayload,
  CourseSyllabus,
  ExamPresetKey,
  MilestoneItem,
  StudentProfile,
  TodoItem,
} from '../types';
import {
  cloneTemplateSyllabus,
  EXAM_PRESETS,
  getFutureDateISO,
} from '../data/syllabusTemplates';
import {
  buildBackupJson,
  exportBackupToFileOrClipboard,
  validateAndParseBackup,
} from '../storage/storageService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  profile: StudentProfile;
  courses: CourseSyllabus[];
  milestones: MilestoneItem[];
  todos: TodoItem[];
  onUpdateName: (name: string) => void;
  onSelectActiveCourse: (courseId: string) => void;
  onAddCourse: (course: CourseSyllabus) => void;
  onDeleteCourse: (courseId: string) => void;
  onRestoreBackup: (payload: AppBackupPayload) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  profile,
  courses,
  milestones,
  todos,
  onUpdateName,
  onSelectActiveCourse,
  onAddCourse,
  onDeleteCourse,
  onRestoreBackup,
}) => {
  const { colors, mode } = useTheme();
  const [nameInput, setNameInput] = useState(profile.name);
  const [newCourseName, setNewCourseName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ExamPresetKey>('NEET');
  const [usePreloaded, setUsePreloaded] = useState(true);
  const [restoreText, setRestoreText] = useState('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNameInput(profile.name);
      setStatusBanner(null);
    }
  }, [visible, profile.name]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setStatusBanner('Please enter a valid name.');
      return;
    }
    onUpdateName(trimmed);
    setStatusBanner('Display name updated.');
  };

  const handleCreateCourse = () => {
    const presetMeta = EXAM_PRESETS.find((p) => p.key === selectedPreset) ?? EXAM_PRESETS[0];
    const finalName =
      newCourseName.trim() ||
      (selectedPreset === 'CUSTOM' ? 'Custom Exam' : presetMeta.label);
    const created = cloneTemplateSyllabus(
      selectedPreset,
      finalName,
      getFutureDateISO(presetMeta.defaultOffsetDays),
      selectedPreset !== 'CUSTOM' && usePreloaded
    );
    onAddCourse(created);
    setNewCourseName('');
    setStatusBanner(`Added & switched to "${created.name}".`);
  };

  const handleExport = async () => {
    const json = buildBackupJson({
      profile,
      courses,
      milestones,
      todos,
      theme: mode,
    });
    const message = await exportBackupToFileOrClipboard(json);
    setStatusBanner(message);
  };

  const handleImport = () => {
    const parsed = validateAndParseBackup(restoreText);
    if (!parsed) {
      setStatusBanner('Invalid backup JSON. Please paste an unmodified StudyPulse export.');
      return;
    }
    onRestoreBackup(parsed);
    setRestoreText('');
    setStatusBanner('Backup restored successfully!');
  };

  return (
    <GlassModal visible={visible} title="Profile, Courses & Backup" onClose={onClose}>
      {statusBanner && (
        <View style={[styles.banner, { backgroundColor: colors.accentSecondarySoft }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.accentSecondary} />
          <Text style={[styles.bannerText, { color: colors.accentSecondary }]}>{statusBanner}</Text>
        </View>
      )}

      {/* Student Identity */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STUDENT IDENTITY</Text>
      <View style={styles.row}>
        <TextInput
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.flex1,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBg,
              borderColor: colors.divider,
            },
          ]}
        />
        <Pressable
          onPress={handleSaveName}
          style={[styles.primaryBtn, { backgroundColor: colors.accentPrimary }]}
        >
          <Text style={styles.primaryBtnText}>Save</Text>
        </Pressable>
      </View>

      {/* Active Courses */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 18 }]}>
        YOUR EXAMS / COURSES ({courses.length})
      </Text>
      {courses.map((course) => {
        const isActive = course.id === profile.activeCourseId;
        return (
          <View
            key={course.id}
            style={[
              styles.courseRow,
              {
                backgroundColor: isActive ? colors.accentPrimarySoft : colors.inputBg,
                borderColor: isActive ? colors.accentPrimary : colors.divider,
              },
            ]}
          >
            <Pressable
              style={styles.flex1}
              onPress={() => {
                onSelectActiveCourse(course.id);
                setStatusBanner(`Switched active exam to ${course.name}.`);
              }}
            >
              <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
              <Text style={[styles.courseMeta, { color: colors.textSecondary }]}>
                Target: {course.examDateISO} • {course.subjects.length} subjects
              </Text>
            </Pressable>

            {courses.length > 1 && (
              <Pressable
                onPress={() =>
                  Alert.alert('Delete Course', `Remove "${course.name}" and its syllabus?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDeleteCourse(course.id) },
                  ])
                }
                hitSlop={8}
                style={styles.trashBtn}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Add Another Course */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 18 }]}>
        ADD NEW EXAM / COURSE
      </Text>
      <View style={styles.chipWrap}>
        {EXAM_PRESETS.map((preset) => {
          const active = preset.key === selectedPreset;
          return (
            <Pressable
              key={preset.key}
              onPress={() => setSelectedPreset(preset.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accentPrimarySoft : colors.inputBg,
                  borderColor: active ? colors.accentPrimary : colors.divider,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.accentPrimary : colors.textSecondary },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={newCourseName}
        onChangeText={setNewCourseName}
        placeholder="Course title (optional, uses preset name)"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
            borderColor: colors.divider,
            marginBottom: 10,
          },
        ]}
      />

      {selectedPreset !== 'CUSTOM' && (
        <Pressable
          onPress={() => setUsePreloaded((v) => !v)}
          style={styles.toggleRow}
        >
          <Ionicons
            name={usePreloaded ? 'checkbox' : 'square-outline'}
            size={20}
            color={colors.accentPrimary}
          />
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            Preload bundled syllabus subjects & topics
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleCreateCourse}
        style={[styles.fullBtn, { backgroundColor: colors.accentPrimary }]}
      >
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Create Course</Text>
      </Pressable>

      {/* Offline JSON Backup & Restore */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 22 }]}>
        OFFLINE JSON BACKUP & RESTORE
      </Text>
      <Pressable
        onPress={handleExport}
        style={[
          styles.outlineBtn,
          { borderColor: colors.accentSecondary, backgroundColor: colors.accentSecondarySoft },
        ]}
      >
        <Ionicons name="share-outline" size={18} color={colors.accentSecondary} />
        <Text style={[styles.outlineBtnText, { color: colors.accentSecondary }]}>
          Export & Copy Backup JSON
        </Text>
      </Pressable>

      <TextInput
        value={restoreText}
        onChangeText={setRestoreText}
        placeholder="Paste exported JSON here to restore..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        style={[
          styles.textArea,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
            borderColor: colors.divider,
          },
        ]}
      />

      <Pressable
        onPress={handleImport}
        disabled={!restoreText.trim()}
        style={[
          styles.fullBtn,
          {
            backgroundColor: restoreText.trim() ? colors.accentSecondary : colors.inputBg,
            opacity: restoreText.trim() ? 1 : 0.6,
          },
        ]}
      >
        <Ionicons
          name="download-outline"
          size={18}
          color={restoreText.trim() ? '#000000' : colors.textMuted}
        />
        <Text
          style={[
            styles.primaryBtnText,
            { color: restoreText.trim() ? '#000000' : colors.textMuted },
          ]}
        >
          Restore from JSON
        </Text>
      </Pressable>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  primaryBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '700',
  },
  courseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fullBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
});

