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
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';


interface SyllabusScreenProps {
  courses: CourseSyllabus[];
  activeCourse: CourseSyllabus;
  onSelectCourse: (courseId: string) => void;
  onUpdateCourse: (updated: CourseSyllabus) => void;
}

type StudyStatus = 'not_started' | 'in_progress' | 'needs_revision' | 'mastered';

type ModalEditorState =
  | { type: 'ADD_SUBJECT' }
  | { type: 'EDIT_SUBJECT'; subjectId: string; currentName: string }
  | { type: 'ADD_CHAPTER'; subjectId: string }
  | { type: 'EDIT_CHAPTER'; subjectId: string; chapterId: string; currentTitle: string }
  | { type: 'ADD_TOPIC'; subjectId: string; chapterId: string }
  | { type: 'EDIT_TOPIC'; subjectId: string; chapterId: string; topicId: string; currentTitle: string }
  | null;

const SUBJECT_ACCENTS = ['#38BDF8', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#FB923C'];

const STATUS_ORDER: StudyStatus[] = [
  'not_started',
  'in_progress',
  'needs_revision',
  'mastered',
];

const STATUS_META: Record<
  StudyStatus,
  {
    label: string;
    shortLabel: string;
    weight: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  not_started: {
    label: 'Not Started',
    shortLabel: 'Todo',
    weight: 0,
    color: '#94A3B8',
    icon: 'ellipse-outline',
  },
  in_progress: {
    label: 'In Progress',
    shortLabel: 'Active',
    weight: 0.4,
    color: '#38BDF8',
    icon: 'time-outline',
  },
  needs_revision: {
    label: 'Needs Revision',
    shortLabel: 'Revise',
    weight: 0.75,
    color: '#FBBF24',
    icon: 'refresh-circle-outline',
  },
  mastered: {
    label: 'Mastered',
    shortLabel: 'Done',
    weight: 1,
    color: '#34D399',
    icon: 'checkmark-circle',
  },
};

function resolveTopicStatus(topic: { status?: StudyStatus; completed?: boolean }): StudyStatus {
  if (topic.status && STATUS_ORDER.includes(topic.status)) {
    return topic.status;
  }
  return topic.completed ? 'mastered' : 'not_started';
}

function getNextStatus(current: StudyStatus): StudyStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export const SyllabusScreen: React.FC<SyllabusScreenProps> = ({
  courses,
  activeCourse,
  onSelectCourse,
  onUpdateCourse,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editorModal, setEditorModal] = useState<ModalEditorState>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudyStatus>('ALL');

  const isFiltering = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  const stats = useMemo(() => {
    let total = 0;
    let masteredCount = 0;
    let weightedSum = 0;

    const subjectBreakdowns = activeCourse.subjects.map((subj) => {
      let sTotal = 0;
      let sMastered = 0;
      let sWeighted = 0;

      for (const chap of subj.chapters) {
        for (const topic of chap.topics) {
          const st = resolveTopicStatus(topic as { status?: StudyStatus; completed?: boolean });
          sTotal += 1;
          sWeighted += STATUS_META[st].weight;
          if (st === 'mastered') sMastered += 1;
        }
      }

      total += sTotal;
      masteredCount += sMastered;
      weightedSum += sWeighted;

      const percent = sTotal === 0 ? 0 : Math.round((sWeighted / sTotal) * 100);
      return {
        id: subj.id,
        name: subj.name,
        color: subj.color,
        total: sTotal,
        mastered: sMastered,
        percent,
      };
    });

    const remaining = Math.max(0, total - masteredCount);
    const percent = total === 0 ? 0 : Math.round((weightedSum / total) * 100);
    return { total, masteredCount, remaining, percent, subjectBreakdowns };
  }, [activeCourse]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && statusFilter === 'ALL') {
      return activeCourse.subjects;
    }

    return activeCourse.subjects
      .map((subj) => {
        const subjMatchesQuery = !q || subj.name.toLowerCase().includes(q);
        const nextChapters = subj.chapters
          .map((chap) => {
            const chapMatchesQuery = !q || chap.title.toLowerCase().includes(q);
            const matchingTopics = chap.topics.filter((topic) => {
              const st = resolveTopicStatus(topic as { status?: StudyStatus; completed?: boolean });
              const statusOk = statusFilter === 'ALL' || st === statusFilter;
              const textOk =
                !q ||
                topic.title.toLowerCase().includes(q) ||
                chapMatchesQuery ||
                subjMatchesQuery;
              return statusOk && textOk;
            });

            if (matchingTopics.length > 0) {
              return { ...chap, topics: matchingTopics };
            }
            if (statusFilter === 'ALL' && (chapMatchesQuery || subjMatchesQuery)) {
              return chap;
            }
            return null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        if (nextChapters.length > 0) {
          return { ...subj, chapters: nextChapters };
        }
        if (statusFilter === 'ALL' && subjMatchesQuery) {
          return subj;
        }
        return null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [activeCourse.subjects, searchQuery, statusFilter]);

  const toggleSubjectExpand = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChapterExpand = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cycleTopicStatus = (subjectId: string, chapterId: string, topicId: string) => {
    const nextSubjects = activeCourse.subjects.map((subj) => {
      if (subj.id !== subjectId) return subj;
      return {
        ...subj,
        chapters: subj.chapters.map((chap) => {
          if (chap.id !== chapterId) return chap;
          return {
            ...chap,
            topics: chap.topics.map((top) => {
              if (top.id !== topicId) return top;
              const current = resolveTopicStatus(
                top as { status?: StudyStatus; completed?: boolean }
              );
              const nextStatus = getNextStatus(current);
              return {
                ...top,
                status: nextStatus,
                completed: nextStatus === 'mastered',
              };
            }),
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
                          {
                            id: createId('top'),
                            title: trimmed,
                            completed: false,
                            status: 'not_started' as StudyStatus,
                          },
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
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 12) + 92,
            maxWidth: layout.contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
          },
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
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Weighted</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.statVal, { color: colors.accentSecondary }]}>
                {stats.masteredCount}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Mastered</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                {stats.remaining}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
          </View>

          {/* Per-Subject Breakdown */}
          {stats.subjectBreakdowns.length > 0 && (
            <View style={[styles.breakdownWrap, { borderTopColor: colors.divider }]}>
              <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
                SUBJECT PROGRESS
              </Text>
              {stats.subjectBreakdowns.map((item) => (
                <View key={item.id} style={styles.breakdownRow}>
                  <View style={styles.breakdownTop}>
                    <Text
                      style={[styles.breakdownName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.breakdownMeta, { color: colors.textSecondary }]}>
                      {item.mastered}/{item.total} done • {item.percent}%
                    </Text>
                  </View>
                  <View style={[styles.miniTrack, { backgroundColor: colors.inputBg }]}>
                    <View
                      style={[
                        styles.miniFill,
                        { width: `${item.percent}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Search & Status Filter Bar */}
        <GlassCard style={styles.filterCard}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.inputBg, borderColor: colors.divider },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search subject, chapter, or topic..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            <Pressable
              onPress={() => setStatusFilter('ALL')}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === 'ALL' ? colors.accentPrimary : colors.inputBg,
                  borderColor: statusFilter === 'ALL' ? colors.accentPrimary : colors.divider,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === 'ALL' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                All
              </Text>
            </Pressable>

            {STATUS_ORDER.map((st) => {
              const active = statusFilter === st;
              const meta = STATUS_META[st];
              return (
                <Pressable
                  key={st}
                  onPress={() => setStatusFilter(st)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? meta.color : colors.inputBg,
                      borderColor: active ? meta.color : colors.divider,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#0B0F17' : colors.textSecondary },
                    ]}
                  >
                    {meta.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </GlassCard>

        {/* Section Header + Add Subject */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Subjects ({filteredSubjects.length}
            {isFiltering ? `/${activeCourse.subjects.length}` : ''})
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

        {filteredSubjects.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={34} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {isFiltering ? 'No Matching Topics' : 'No Subjects Yet'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {isFiltering
                  ? 'Try clearing your search or switching the status filter.'
                  : 'Tap "Add Subject" above to build your custom study tree.'}
              </Text>
            </View>
          </GlassCard>
        ) : (
          filteredSubjects.map((subject) => {
            const subjExpanded = isFiltering || Boolean(expandedSubjects[subject.id]);
            let subjTotal = 0;
            let subjMastered = 0;
            let subjWeighted = 0;
            for (const c of subject.chapters) {
              for (const t of c.topics) {
                const st = resolveTopicStatus(t as { status?: StudyStatus; completed?: boolean });
                subjTotal += 1;
                subjWeighted += STATUS_META[st].weight;
                if (st === 'mastered') subjMastered += 1;
              }
            }
            const subjPct = subjTotal === 0 ? 0 : Math.round((subjWeighted / subjTotal) * 100);

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
                      {subjMastered}/{subjTotal} mastered • {subjPct}%
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
                      const chapExpanded = isFiltering || Boolean(expandedChapters[chapter.id]);
                      const chapTotal = chapter.topics.length;
                      let chapWeighted = 0;
                      for (const t of chapter.topics) {
                        const st = resolveTopicStatus(
                          t as { status?: StudyStatus; completed?: boolean }
                        );
                        chapWeighted += STATUS_META[st].weight;
                      }
                      const chapPct =
                        chapTotal === 0 ? 0 : Math.round((chapWeighted / chapTotal) * 100);

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
                                {chapPct}% mastery • {chapTotal} topics
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
                              {chapter.topics.map((topic) => {
                                const st = resolveTopicStatus(
                                  topic as { status?: StudyStatus; completed?: boolean }
                                );
                                const meta = STATUS_META[st];
                                const isMastered = st === 'mastered';

                                return (
                                  <View
                                    key={topic.id}
                                    style={[styles.topicRow, { borderTopColor: colors.divider }]}
                                  >
                                    <Pressable
                                      onPress={() =>
                                        cycleTopicStatus(subject.id, chapter.id, topic.id)
                                      }
                                      style={styles.topicCheckArea}
                                    >
                                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                                      <View style={styles.flex1}>
                                        <Text
                                          style={[
                                            styles.topicTitle,
                                            {
                                              color: isMastered
                                                ? colors.textMuted
                                                : colors.textPrimary,
                                              textDecorationLine: isMastered
                                                ? 'line-through'
                                                : 'none',
                                            },
                                          ]}
                                        >
                                          {topic.title}
                                        </Text>
                                        <Text style={[styles.statusTag, { color: meta.color }]}>
                                          {meta.label} • Tap to cycle
                                        </Text>
                                      </View>
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
                                );
                              })}

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
    marginBottom: 14,
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
  breakdownWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  breakdownRow: {
    gap: 4,
  },
  breakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  breakdownName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  breakdownMeta: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  miniTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 999,
  },
  filterCard: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterChipsRow: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
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
    lineHeight: 18,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
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
