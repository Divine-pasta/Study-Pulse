import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { CourseSyllabus, SubjectItem } from '../types';
import { createId } from '../data/syllabusTemplates';

interface SyllabusScreenProps {
  courses: CourseSyllabus[];
  activeCourse: CourseSyllabus;
  onSelectCourse: (courseId: string) => void;
  onUpdateCourse: (updated: CourseSyllabus) => void;
}

type ModalEditorState =
  | { type: 'ADD_SUBJECT' }
  | { type: 'EDIT_SUBJECT'; subjectId: string; currentName: string }
  | { type: 'ADD_CHAPTER'; subjectId: string }
  | { type: 'EDIT_CHAPTER'; subjectId: string; chapterId: string; currentTitle: string }
  | { type: 'ADD_TOPIC'; subjectId: string; chapterId: string }
  | { type: 'EDIT_TOPIC'; subjectId: string; chapterId: string; topicId: string; currentTitle: string }
  | null;

const SUBJECT_ACCENTS = ['#38BDF8', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#FB923C'];

export const SyllabusScreen: React.FC<SyllabusScreenProps> = ({
  courses,
  activeCourse,
  onSelectCourse,
  onUpdateCourse,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editorModal, setEditorModal] = useState<ModalEditorState>(null);
  const [inputText, setInputText] = useState('');

  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const subj of activeCourse.subjects) {
      for (const chap of subj.chapters) {
        for (const topic of chap.topics) {
          total += 1;
          if (topic.completed) completed += 1;
        }
      }
    }
    const remaining = Math.max(0, total - completed);
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, remaining, percent };
  }, [activeCourse]);

  const toggleSubjectExpand = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChapterExpand = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopicComplete = (subjectId: string, chapterId: string, topicId: string) => {
    const nextSubjects = activeCourse.subjects.map((subj) => {
      if (subj.id !== subjectId) return subj;
      return {
        ...subj,
        chapters: subj.chapters.map((chap) => {
          if (chap.id !== chapterId) return chap;
          return {
            ...chap,
            topics: chap.topics.map((top) =>
              top.id === topicId ? { ...top, completed: !top.completed } : top
            ),
          };
        }),
      };
    });
    onUpdateCourse({ ...activeCourse, subjects: nextSubjects });
  };

  const openEditor = (state: ModalEditorState, initialValue = '') => {
    setInputText(initialValue);
    setEditorModal(state);
  };

  const handleSaveEditor = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !editorModal) return;

    if (editorModal.type === 'ADD_SUBJECT') {
      const color = SUBJECT_ACCENTS[activeCourse.subjects.length % SUBJECT_ACCENTS.length];
      const newSubj: SubjectItem = {
        id: createId('subj'),
        name: trimmed,
        color,
        chapters: [],
      };
      onUpdateCourse({
        ...activeCourse,
        subjects: [...activeCourse.subjects, newSubj],
      });
      setExpandedSubjects((prev) => ({ ...prev, [newSubj.id]: true }));
    } else if (editorModal.type === 'EDIT_SUBJECT') {
      onUpdateCourse({
        ...activeCourse,
        subjects: activeCourse.subjects.map((s) =>
          s.id === editorModal.subjectId ? { ...s, name: trimmed } : s
        ),
      });
    } else if (editorModal.type === 'ADD_CHAPTER') {
      const newChapId = createId('chap');
      onUpdateCourse({
        ...activeCourse,
        subjects: activeCourse.subjects.map((s) =>
          s.id === editorModal.subjectId
            ? {
                ...s,
                chapters: [...s.chapters, { id: newChapId, title: trimmed, topics: [] }],
              }
            : s
        ),
      });
      setExpandedSubjects((prev) => ({ ...prev, [editorModal.subjectId]: true }));
      setExpandedChapters((prev) => ({ ...prev, [newChapId]: true }));
    } else if (editorModal.type === 'EDIT_CHAPTER') {
      onUpdateCourse({
        ...activeCourse,
        subjects: activeCourse.subjects.map((s) =>
          s.id === editorModal.subjectId
            ? {
                ...s,
                chapters: s.chapters.map((c) =>
                  c.id === editorModal.chapterId ? { ...c, title: trimmed } : c
                ),
              }
            : s
        ),
      });
    } else if (editorModal.type === 'ADD_TOPIC') {
      onUpdateCourse({
        ...activeCourse,
        subjects: activeCourse.subjects.map((s) =>
          s.id === editorModal.subjectId
            ? {
                ...s,
                chapters: s.chapters.map((c) =>
                  c.id === editorModal.chapterId
                    ? {
                        ...c,
                        topics: [
                          ...c.topics,
                          { id: createId('top'), title: trimmed, completed: false },
                        ],
                      }
                    : c
                ),
              }
            : s
        ),
      });
      setExpandedChapters((prev) => ({ ...prev, [editorModal.chapterId]: true }));
    } else if (editorModal.type === 'EDIT_TOPIC') {
      onUpdateCourse({
        ...activeCourse,
        subjects: activeCourse.subjects.map((s) =>
          s.id === editorModal.subjectId
            ? {
                ...s,
                chapters: s.chapters.map((c) =>
                  c.id === editorModal.chapterId
                    ? {
                        ...c,
                        topics: c.topics.map((t) =>
                          t.id === editorModal.topicId ? { ...t, title: trimmed } : t
                        ),
                      }
                    : c
                ),
              }
            : s
        ),
      });
    }

    setEditorModal(null);
    setInputText('');
  };

  const confirmDeleteSubject = (subjectId: string, name: string) => {
    Alert.alert('Delete Subject', `Remove "${name}" and all its chapters/topics?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          onUpdateCourse({
            ...activeCourse,
            subjects: activeCourse.subjects.filter((s) => s.id !== subjectId),
          }),
      },
    ]);
  };

  const confirmDeleteChapter = (subjectId: string, chapterId: string, title: string) => {
    Alert.alert('Delete Chapter', `Remove "${title}" and its topics?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          onUpdateCourse({
            ...activeCourse,
            subjects: activeCourse.subjects.map((s) =>
              s.id === subjectId
                ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
                : s
            ),
          }),
      },
    ]);
  };

  const deleteTopic = (subjectId: string, chapterId: string, topicId: string) => {
    onUpdateCourse({
      ...activeCourse,
      subjects: activeCourse.subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId
                  ? { ...c, topics: c.topics.filter((t) => t.id !== topicId) }
                  : c
              ),
            }
          : s
      ),
    });
  };

  const modalTitle = useMemo(() => {
    if (!editorModal) return '';
    switch (editorModal.type) {
      case 'ADD_SUBJECT':
        return 'Add Subject';
      case 'EDIT_SUBJECT':
        return 'Rename Subject';
      case 'ADD_CHAPTER':
        return 'Add Chapter';
      case 'EDIT_CHAPTER':
        return 'Rename Chapter';
      case 'ADD_TOPIC':
        return 'Add Topic';
      case 'EDIT_TOPIC':
        return 'Edit Topic';
    }
  }, [editorModal]);

  return (
    <View style={styles.flex1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 92 },
        ]}
      >
        {/* Course Switcher Pills (if multiple courses exist) */}
        {courses.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseSwitcherRow}
          >
            {courses.map((c) => {
              const selected = c.id === activeCourse.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onSelectCourse(c.id)}
                  style={[
                    styles.coursePill,
                    {
                      backgroundColor: selected ? colors.accentPrimary : colors.glassFill,
                      borderColor: selected ? colors.accentPrimary : colors.specularTopBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.coursePillText,
                      { color: selected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Overall Completion Hero Card */}
        <GlassCard elevated style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
                SYLLABUS MASTERY
              </Text>
              <Text style={[styles.percentBig, { color: colors.textPrimary }]}>
                {stats.percent}%
              </Text>
            </View>
            <View style={[styles.ringBadge, { backgroundColor: colors.accentSecondarySoft }]}>
              <Ionicons name="checkmark-done" size={22} color={colors.accentSecondary} />
            </View>
          </View>

          {/* Progress Track */}
          <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${stats.percent}%`,
                  backgroundColor:
                    stats.percent === 100 ? colors.accentSecondary : colors.accentPrimary,
                },
              ]}
            />
          </View>

          {/* 3 Stat Tiles */}
          <View style={styles.statGrid}>
            <View style={[styles.statTile, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.statVal, { color: colors.accentPrimary }]}>
                {stats.percent}%
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.statVal, { color: colors.accentSecondary }]}>
                {stats.completed}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Topics Done</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                {stats.remaining}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
          </View>
        </GlassCard>

        {/* Section Header + Add Subject */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Subjects ({activeCourse.subjects.length})
          </Text>
          <Pressable
            onPress={() => openEditor({ type: 'ADD_SUBJECT' })}
            style={[
              styles.addSubjectBtn,
              { backgroundColor: colors.accentPrimarySoft, borderColor: colors.accentPrimary },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.accentPrimary} />
            <Text style={[styles.addSubjectText, { color: colors.accentPrimary }]}>
              Add Subject
            </Text>
          </Pressable>
        </View>

        {activeCourse.subjects.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={34} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Subjects Yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Tap "Add Subject" above to build your custom study tree.
              </Text>
            </View>
          </GlassCard>
        ) : (
          activeCourse.subjects.map((subject) => {
            const subjExpanded = Boolean(expandedSubjects[subject.id]);
            let subjTotal = 0;
            let subjDone = 0;
            for (const c of subject.chapters) {
              for (const t of c.topics) {
                subjTotal += 1;
                if (t.completed) subjDone += 1;
              }
            }
            const subjPct = subjTotal === 0 ? 0 : Math.round((subjDone / subjTotal) * 100);

            return (
              <GlassCard key={subject.id} style={styles.subjectCard} contentStyle={styles.noPad}>
                {/* Subject Header */}
                <Pressable
                  onPress={() => toggleSubjectExpand(subject.id)}
                  style={styles.subjectHeader}
                >
                  <View style={[styles.colorBar, { backgroundColor: subject.color }]} />
                  <View style={styles.flex1}>
                    <Text style={[styles.subjectName, { color: colors.textPrimary }]}>
                      {subject.name}
                    </Text>
                    <Text style={[styles.subjectMeta, { color: colors.textSecondary }]}>
                      {subjDone}/{subjTotal} topics • {subjPct}%
                    </Text>
                  </View>

                  <View style={styles.iconActions}>
                    <Pressable
                      onPress={() =>
                        openEditor(
                          { type: 'EDIT_SUBJECT', subjectId: subject.id, currentName: subject.name },
                          subject.name
                        )
                      }
                      hitSlop={8}
                      style={styles.miniAction}
                    >
                      <Ionicons name="pencil" size={15} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDeleteSubject(subject.id, subject.name)}
                      hitSlop={8}
                      style={styles.miniAction}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </Pressable>
                    <Ionicons
                      name={subjExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {/* Expanded Chapters */}
                {subjExpanded && (
                  <View style={[styles.chaptersWrap, { borderTopColor: colors.divider }]}>
                    {subject.chapters.map((chapter) => {
                      const chapExpanded = Boolean(expandedChapters[chapter.id]);
                      const chapTotal = chapter.topics.length;
                      const chapDone = chapter.topics.filter((t) => t.completed).length;

                      return (
                        <View
                          key={chapter.id}
                          style={[styles.chapterBox, { backgroundColor: colors.inputBg }]}
                        >
                          <Pressable
                            onPress={() => toggleChapterExpand(chapter.id)}
                            style={styles.chapterHeader}
                          >
                            <Ionicons
                              name={chapExpanded ? 'folder-open' : 'folder'}
                              size={16}
                              color={subject.color}
                            />
                            <View style={styles.flex1}>
                              <Text style={[styles.chapterTitle, { color: colors.textPrimary }]}>
                                {chapter.title}
                              </Text>
                              <Text style={[styles.chapterMeta, { color: colors.textSecondary }]}>
                                {chapDone}/{chapTotal} completed
                              </Text>
                            </View>

                            <View style={styles.iconActions}>
                              <Pressable
                                onPress={() =>
                                  openEditor(
                                    {
                                      type: 'EDIT_CHAPTER',
                                      subjectId: subject.id,
                                      chapterId: chapter.id,
                                      currentTitle: chapter.title,
                                    },
                                    chapter.title
                                  )
                                }
                                hitSlop={6}
                                style={styles.miniAction}
                              >
                                <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  confirmDeleteChapter(subject.id, chapter.id, chapter.title)
                                }
                                hitSlop={6}
                                style={styles.miniAction}
                              >
                                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                              </Pressable>
                              <Ionicons
                                name={chapExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={colors.textSecondary}
                              />
                            </View>
                          </Pressable>

                          {chapExpanded && (
                            <View style={styles.topicsList}>
                              {chapter.topics.map((topic) => (
                                <View
                                  key={topic.id}
                                  style={[styles.topicRow, { borderTopColor: colors.divider }]}
                                >
                                  <Pressable
                                    onPress={() =>
                                      toggleTopicComplete(subject.id, chapter.id, topic.id)
                                    }
                                    style={styles.topicCheckArea}
                                  >
                                    <Ionicons
                                      name={topic.completed ? 'checkbox' : 'square-outline'}
                                      size={20}
                                      color={
                                        topic.completed ? colors.accentSecondary : colors.textMuted
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.topicTitle,
                                        {
                                          color: topic.completed
                                            ? colors.textMuted
                                            : colors.textPrimary,
                                          textDecorationLine: topic.completed
                                            ? 'line-through'
                                            : 'none',
                                        },
                                      ]}
                                    >
                                      {topic.title}
                                    </Text>
                                  </Pressable>

                                  <View style={styles.iconActions}>
                                    <Pressable
                                      onPress={() =>
                                        openEditor(
                                          {
                                            type: 'EDIT_TOPIC',
                                            subjectId: subject.id,
                                            chapterId: chapter.id,
                                            topicId: topic.id,
                                            currentTitle: topic.title,
                                          },
                                          topic.title
                                        )
                                      }
                                      hitSlop={6}
                                      style={styles.miniAction}
                                    >
                                      <Ionicons
                                        name="pencil"
                                        size={13}
                                        color={colors.textSecondary}
                                      />
                                    </Pressable>
                                    <Pressable
                                      onPress={() =>
                                        deleteTopic(subject.id, chapter.id, topic.id)
                                      }
                                      hitSlop={6}
                                      style={styles.miniAction}
                                    >
                                      <Ionicons
                                        name="close-circle-outline"
                                        size={15}
                                        color={colors.danger}
                                      />
                                    </Pressable>
                                  </View>
                                </View>
                              ))}

                              <Pressable
                                onPress={() =>
                                  openEditor({
                                    type: 'ADD_TOPIC',
                                    subjectId: subject.id,
                                    chapterId: chapter.id,
                                  })
                                }
                                style={styles.inlineAddBtn}
                              >
                                <Ionicons name="add" size={15} color={colors.accentPrimary} />
                                <Text
                                  style={[styles.inlineAddText, { color: colors.accentPrimary }]}
                                >
                                  Add Topic
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    <Pressable
                      onPress={() => openEditor({ type: 'ADD_CHAPTER', subjectId: subject.id })}
                      style={[
                        styles.addChapterBtn,
                        { borderColor: colors.divider, backgroundColor: colors.inputBg },
                      ]}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={colors.accentPrimary} />
                      <Text style={[styles.addChapterText, { color: colors.accentPrimary }]}>
                        Add Chapter to {subject.name}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Add / Rename Modal */}
      <GlassModal
        visible={editorModal !== null}
        title={modalTitle}
        onClose={() => setEditorModal(null)}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter title..."
          placeholderTextColor={colors.textMuted}
          autoFocus
          onSubmitEditing={handleSaveEditor}
          style={[
            styles.modalInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBg,
              borderColor: colors.divider,
            },
          ]}
        />
        <Pressable
          onPress={handleSaveEditor}
          disabled={!inputText.trim()}
          style={[
            styles.modalSaveBtn,
            {
              backgroundColor: inputText.trim() ? colors.accentPrimary : colors.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.modalSaveText,
              { color: inputText.trim() ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            Save
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
  courseSwitcherRow: {
    gap: 8,
    paddingBottom: 12,
  },
  coursePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  percentBig: {
    fontSize: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  ringBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  addSubjectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  subjectCard: {
    marginBottom: 12,
  },
  noPad: {
    padding: 0,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  colorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
  },
  subjectMeta: {
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAction: {
    padding: 4,
  },
  chaptersWrap: {
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  chapterBox: {
    borderRadius: 14,
    padding: 10,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterMeta: {
    fontSize: 11,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  topicsList: {
    marginTop: 8,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  topicCheckArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingRight: 8,
  },
  topicTitle: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  inlineAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addChapterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  modalSaveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

