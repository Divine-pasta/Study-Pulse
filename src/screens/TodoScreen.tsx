import React, { useMemo, useState } from 'react';
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
import { SubjectItem, TodoItem } from '../types';
import { createId } from '../data/syllabusTemplates';

interface TodoScreenProps {
  todos: TodoItem[];
  subjects: SubjectItem[];
  onAddTodo: (todo: TodoItem) => void;
  onToggleTodo: (id: string) => void;
  onEditTodo: (id: string, title: string, subjectTag?: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodoScreen: React.FC<TodoScreenProps> = ({
  todos,
  subjects,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  onDeleteTodo,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [newTitle, setNewTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTag, setEditTag] = useState<string | undefined>(undefined);

  const subjectNames = useMemo(() => subjects.map((s) => s.name), [subjects]);

  const activeTodos = useMemo(
    () => todos.filter((t) => !t.completed).sort((a, b) => b.createdAt - a.createdAt),
    [todos]
  );

  const completedTodos = useMemo(
    () => todos.filter((t) => t.completed).sort((a, b) => b.createdAt - a.createdAt),
    [todos]
  );

  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTodo({
      id: createId('todo'),
      title: trimmed,
      subjectTag: selectedTag,
      completed: false,
      createdAt: Date.now(),
    });
    setNewTitle('');
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditTag(todo.subjectTag);
  };

  const handleSaveEdit = () => {
    const trimmed = editTitle.trim();
    if (!editingTodo || !trimmed) return;
    onEditTodo(editingTodo.id, trimmed, editTag);
    setEditingTodo(null);
  };

  return (
    <View style={styles.flex1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 92 },
        ]}
      >
        {/* Quick Task Composer Card */}
        <GlassCard elevated style={styles.composerCard}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>QUICK TASK</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Add study task, DPP, or revision item..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleCreate}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.divider,
                },
              ]}
            />
            <Pressable
              onPress={handleCreate}
              disabled={!newTitle.trim()}
              style={[
                styles.addBtn,
                {
                  backgroundColor: newTitle.trim() ? colors.accentPrimary : colors.inputBg,
                },
              ]}
            >
              <Ionicons
                name="add"
                size={22}
                color={newTitle.trim() ? '#FFFFFF' : colors.textMuted}
              />
            </Pressable>
          </View>

          {subjectNames.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagRow}
            >
              <Pressable
                onPress={() => setSelectedTag(undefined)}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: !selectedTag ? colors.accentPrimarySoft : colors.inputBg,
                    borderColor: !selectedTag ? colors.accentPrimary : colors.divider,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: !selectedTag ? colors.accentPrimary : colors.textSecondary },
                  ]}
                >
                  General
                </Text>
              </Pressable>

              {subjectNames.map((subj) => {
                const active = selectedTag === subj;
                return (
                  <Pressable
                    key={subj}
                    onPress={() => setSelectedTag(active ? undefined : subj)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: active ? colors.accentPrimarySoft : colors.inputBg,
                        borderColor: active ? colors.accentPrimary : colors.divider,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: active ? colors.accentPrimary : colors.textSecondary },
                      ]}
                    >
                      {subj}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </GlassCard>

        {/* Active Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Active Tasks ({activeTodos.length})
          </Text>
        </View>

        {activeTodos.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.accentSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                All Caught Up!
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Add your next study target above.
              </Text>
            </View>
          </GlassCard>
        ) : (
          activeTodos.map((todo) => (
            <GlassCard key={todo.id} style={styles.todoCard} contentStyle={styles.todoRow}>
              <Pressable onPress={() => onToggleTodo(todo.id)} style={styles.checkArea}>
                <Ionicons name="square-outline" size={22} color={colors.accentPrimary} />
                <View style={styles.flex1}>
                  <Text style={[styles.todoTitle, { color: colors.textPrimary }]}>
                    {todo.title}
                  </Text>
                  {todo.subjectTag && (
                    <View
                      style={[styles.subjectPill, { backgroundColor: colors.accentPrimarySoft }]}
                    >
                      <Text style={[styles.subjectPillText, { color: colors.accentPrimary }]}>
                        {todo.subjectTag}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>

              <View style={styles.actions}>
                <Pressable onPress={() => openEditModal(todo)} hitSlop={8} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => onDeleteTodo(todo.id)}
                  hitSlop={8}
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </GlassCard>
          ))
        )}

        {/* Collapsible Completed List */}
        {completedTodos.length > 0 && (
          <View style={styles.completedSection}>
            <Pressable
              onPress={() => setCompletedExpanded((v) => !v)}
              style={[
                styles.completedHeader,
                { backgroundColor: colors.glassFill, borderColor: colors.specularTopBorder },
              ]}
            >
              <View style={styles.completedLeft}>
                <Ionicons name="checkmark-done" size={18} color={colors.accentSecondary} />
                <Text style={[styles.completedTitle, { color: colors.textPrimary }]}>
                  Completed ({completedTodos.length})
                </Text>
              </View>
              <Ionicons
                name={completedExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            {completedExpanded &&
              completedTodos.map((todo) => (
                <GlassCard key={todo.id} style={styles.todoCard} contentStyle={styles.todoRow}>
                  <Pressable onPress={() => onToggleTodo(todo.id)} style={styles.checkArea}>
                    <Ionicons name="checkbox" size={22} color={colors.accentSecondary} />
                    <View style={styles.flex1}>
                      <Text
                        style={[
                          styles.todoTitle,
                          {
                            color: colors.textMuted,
                            textDecorationLine: 'line-through',
                          },
                        ]}
                      >
                        {todo.title}
                      </Text>
                      {todo.subjectTag && (
                        <Text style={[styles.doneTag, { color: colors.textMuted }]}>
                          {todo.subjectTag}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => onDeleteTodo(todo.id)}
                    hitSlop={8}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </GlassCard>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Todo Modal */}
      <GlassModal
        visible={editingTodo !== null}
        title="Edit Task"
        onClose={() => setEditingTodo(null)}
      >
        <TextInput
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Task title"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.modalInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBg,
              borderColor: colors.divider,
            },
          ]}
        />

        {subjectNames.length > 0 && (
          <View style={styles.modalTags}>
            <Pressable
              onPress={() => setEditTag(undefined)}
              style={[
                styles.tagChip,
                {
                  backgroundColor: !editTag ? colors.accentPrimarySoft : colors.inputBg,
                  borderColor: !editTag ? colors.accentPrimary : colors.divider,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: !editTag ? colors.accentPrimary : colors.textSecondary },
                ]}
              >
                General
              </Text>
            </Pressable>
            {subjectNames.map((subj) => {
              const active = editTag === subj;
              return (
                <Pressable
                  key={subj}
                  onPress={() => setEditTag(active ? undefined : subj)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: active ? colors.accentPrimarySoft : colors.inputBg,
                      borderColor: active ? colors.accentPrimary : colors.divider,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: active ? colors.accentPrimary : colors.textSecondary },
                    ]}
                  >
                    {subj}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={handleSaveEdit}
          disabled={!editTitle.trim()}
          style={[
            styles.saveBtn,
            { backgroundColor: editTitle.trim() ? colors.accentPrimary : colors.inputBg },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: editTitle.trim() ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            Update Task
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
  composerCard: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    gap: 8,
    paddingTop: 10,
  },
  tagChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 2,
  },
  todoCard: {
    marginBottom: 10,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  checkArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todoTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  subjectPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 4,
  },
  completedSection: {
    marginTop: 14,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  completedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneTag: {
    fontSize: 11,
    marginTop: 2,
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

