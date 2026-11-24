import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  AppBackupPayload,
  CourseSyllabus,
  MilestoneItem,
  StudentProfile,
  TabKey,
  ThemeMode,
  TodoItem,
} from './src/types';
import { ThemeProvider } from './src/theme/ThemeContext';
import {
  loadInitialState,
  persistFullBackup,
  saveCourses,
  saveMilestones,
  saveProfile,
  saveTheme,
  saveTodos,
} from './src/storage/storageService';
import { cloneTemplateSyllabus, getFutureDateISO } from './src/data/syllabusTemplates';
import { AmbientBackground } from './src/components/AmbientBackground';
import { TopHeader } from './src/components/TopHeader';
import { FloatingNavDock } from './src/components/FloatingNavDock';
import { SettingsModal } from './src/components/SettingsModal';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SyllabusScreen } from './src/screens/SyllabusScreen';
import { CountdownScreen } from './src/screens/CountdownScreen';
import { TodoScreen } from './src/screens/TodoScreen';

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<CourseSyllabus[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>('syllabus');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadPersistedState = useCallback(async () => {
    try {
      const loaded = await loadInitialState();
      setThemeMode(loaded.theme);
      setProfile(loaded.profile);
      setCourses(loaded.courses);
      setMilestones(loaded.milestones);
      setTodos(loaded.todos);
      setHydrated(true);
    } catch (err) {
      console.warn('Failed to load persisted state:', err);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadInitialState()
      .then((loaded) => {
        if (!mounted) return;
        setThemeMode(loaded.theme);
        setProfile(loaded.profile);
        setCourses(loaded.courses);
        setMilestones(loaded.milestones);
        setTodos(loaded.todos);
        setHydrated(true);
      })
      .catch((err) => {
        console.warn('Initial state load failed:', err);
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleThemeChange = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    void saveTheme(next);
  }, []);

  const handleCompleteOnboarding = useCallback(
    (newProfile: StudentProfile, initialCourse: CourseSyllabus) => {
      const nextCourses = [initialCourse];
      setProfile(newProfile);
      setCourses(nextCourses);
      void saveProfile(newProfile);
      void saveCourses(nextCourses);
    },
    []
  );

  const activeCourse = useMemo<CourseSyllabus>(() => {
    if (courses.length === 0) {
      return cloneTemplateSyllabus('CUSTOM', 'My Exam', getFutureDateISO(60), false);
    }
    if (profile) {
      const found = courses.find((c) => c.id === profile.activeCourseId);
      if (found) return found;
    }
    return courses[0];
  }, [courses, profile]);

  const handleSelectActiveCourse = useCallback(
    (courseId: string) => {
      if (!profile) return;
      const updatedProfile: StudentProfile = { ...profile, activeCourseId: courseId };
      setProfile(updatedProfile);
      void saveProfile(updatedProfile);
    },
    [profile]
  );

  const handleUpdateCourse = useCallback((updatedCourse: CourseSyllabus) => {
    setCourses((prev) => {
      const next = prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
      void saveCourses(next);
      return next;
    });
  }, []);

  const handleChangeExamDate = useCallback(
    (newDateISO: string) => {
      handleUpdateCourse({ ...activeCourse, examDateISO: newDateISO });
    },
    [activeCourse, handleUpdateCourse]
  );

  const handleAddMilestone = useCallback((milestone: MilestoneItem) => {
    setMilestones((prev) => {
      const next = [...prev, milestone];
      void saveMilestones(next);
      return next;
    });
  }, []);

  const handleDeleteMilestone = useCallback((id: string) => {
    setMilestones((prev) => {
      const next = prev.filter((m) => m.id !== id);
      void saveMilestones(next);
      return next;
    });
  }, []);

  const handleAddTodo = useCallback((todo: TodoItem) => {
    setTodos((prev) => {
      const next = [todo, ...prev];
      void saveTodos(next);
      return next;
    });
  }, []);

  const handleToggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      void saveTodos(next);
      return next;
    });
  }, []);

  const handleEditTodo = useCallback((id: string, title: string, subjectTag?: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, title, subjectTag } : t));
      void saveTodos(next);
      return next;
    });
  }, []);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void saveTodos(next);
      return next;
    });
  }, []);

  const handleUpdateName = useCallback(
    (name: string) => {
      if (!profile) return;
      const updated: StudentProfile = { ...profile, name };
      setProfile(updated);
      void saveProfile(updated);
    },
    [profile]
  );

  const handleAddCourse = useCallback(
    (newCourse: CourseSyllabus) => {
      setCourses((prev) => {
        const next = [...prev, newCourse];
        void saveCourses(next);
        return next;
      });
      if (profile) {
        const updatedProfile: StudentProfile = { ...profile, activeCourseId: newCourse.id };
        setProfile(updatedProfile);
        void saveProfile(updatedProfile);
      }
    },
    [profile]
  );

  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      setCourses((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((c) => c.id !== courseId);
        void saveCourses(next);
        if (profile && profile.activeCourseId === courseId) {
          const updatedProfile: StudentProfile = { ...profile, activeCourseId: next[0].id };
          setProfile(updatedProfile);
          void saveProfile(updatedProfile);
        }
        return next;
      });
    },
    [profile]
  );

  const handleRestoreBackup = useCallback((payload: AppBackupPayload) => {
    setProfile(payload.profile);
    setCourses(payload.courses);
    setMilestones(payload.milestones);
    setTodos(payload.todos);
    setThemeMode(payload.theme);
    void persistFullBackup(payload);
  }, []);

  const pendingTodoCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos]
  );

  if (!hydrated) {
    return (
      <SafeAreaProvider>
        <View style={styles.splashLoader}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider mode={themeMode} onChangeMode={handleThemeChange}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

        {!profile || !profile.onboarded ? (
          <OnboardingScreen onCompleteOnboarding={handleCompleteOnboarding} />
        ) : (
          <AmbientBackground>
            <TopHeader
              studentName={profile.name}
              activeCourseName={activeCourse.name}
              onOpenSettings={() => setSettingsOpen(true)}
            />

            <View style={styles.screenBody}>
              {activeTab === 'syllabus' && (
                <SyllabusScreen
                  courses={courses}
                  activeCourse={activeCourse}
                  onSelectCourse={handleSelectActiveCourse}
                  onUpdateCourse={handleUpdateCourse}
                />
              )}

              {activeTab === 'countdown' && (
                <CountdownScreen
                  activeCourse={activeCourse}
                  milestones={milestones}
                  onChangeExamDate={handleChangeExamDate}
                  onAddMilestone={handleAddMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                />
              )}

              {activeTab === 'todo' && (
                <TodoScreen
                  todos={todos}
                  subjects={activeCourse.subjects}
                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onEditTodo={handleEditTodo}
                  onDeleteTodo={handleDeleteTodo}
                />
              )}
            </View>

            <FloatingNavDock
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              pendingTodoCount={pendingTodoCount}
            />

            <SettingsModal
              visible={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              profile={profile}
              courses={courses}
              milestones={milestones}
              todos={todos}
              onUpdateName={handleUpdateName}
              onSelectActiveCourse={handleSelectActiveCourse}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
              onRestoreBackup={handleRestoreBackup}
            />
          </AmbientBackground>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashLoader: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenBody: {
    flex: 1,
  },
});
