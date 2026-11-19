import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {
  AppBackupPayload,
  CourseSyllabus,
  MilestoneItem,
  StudentProfile,
  ThemeMode,
  TodoItem,
} from '../types';

const KEYS = {
  PROFILE: '@studypulse/profile_v1',
  COURSES: '@studypulse/courses_v1',
  MILESTONES: '@studypulse/milestones_v1',
  TODOS: '@studypulse/todos_v1',
  THEME: '@studypulse/theme_v1',
} as const;

export interface LoadedAppState {
  profile: StudentProfile | null;
  courses: CourseSyllabus[];
  milestones: MilestoneItem[];
  todos: TodoItem[];
  theme: ThemeMode;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function loadInitialState(): Promise<LoadedAppState> {
  try {
    const entries = await AsyncStorage.multiGet([
      KEYS.PROFILE,
      KEYS.COURSES,
      KEYS.MILESTONES,
      KEYS.TODOS,
      KEYS.THEME,
    ]);

    const map = new Map<string, string | null>(entries);
    const rawProfile = safeJsonParse<StudentProfile | null>(map.get(KEYS.PROFILE) ?? null, null);
    const rawCourses = safeJsonParse<CourseSyllabus[]>(map.get(KEYS.COURSES) ?? null, []);
    const rawMilestones = safeJsonParse<MilestoneItem[]>(map.get(KEYS.MILESTONES) ?? null, []);
    const rawTodos = safeJsonParse<TodoItem[]>(map.get(KEYS.TODOS) ?? null, []);
    const rawTheme = map.get(KEYS.THEME);

    const validCourses = Array.isArray(rawCourses) ? rawCourses : [];
    const validMilestones = Array.isArray(rawMilestones) ? rawMilestones : [];
    const validTodos = Array.isArray(rawTodos) ? rawTodos : [];
    const theme: ThemeMode = rawTheme === 'light' ? 'light' : 'dark';

    const profile: StudentProfile | null =
      rawProfile &&
      typeof rawProfile.name === 'string' &&
      rawProfile.name.trim().length > 0 &&
      rawProfile.onboarded
        ? rawProfile
        : null;

    return {
      profile,
      courses: validCourses,
      milestones: validMilestones,
      todos: validTodos,
      theme,
    };
  } catch {
    return {
      profile: null,
      courses: [],
      milestones: [],
      todos: [],
      theme: 'dark',
    };
  }
}

export async function saveProfile(profile: StudentProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function saveCourses(courses: CourseSyllabus[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
}

export async function saveMilestones(milestones: MilestoneItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MILESTONES, JSON.stringify(milestones));
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
}

export async function saveTheme(theme: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, theme);
}

export function buildBackupJson(state: {
  profile: StudentProfile;
  courses: CourseSyllabus[];
  milestones: MilestoneItem[];
  todos: TodoItem[];
  theme: ThemeMode;
}): string {
  const payload: AppBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    courses: state.courses,
    milestones: state.milestones,
    todos: state.todos,
    theme: state.theme,
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportBackupToFileOrClipboard(jsonString: string): Promise<string> {
  await Clipboard.setStringAsync(jsonString);
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare && FileSystem.cacheDirectory) {
      const fileUri = `${FileSystem.cacheDirectory}studypulse-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export StudyPulse Backup',
      });
      return 'Backup shared & copied to clipboard.';
    }
    return 'Backup JSON copied to clipboard.';
  } catch {
    return 'Backup JSON copied to clipboard.';
  }
}

export function validateAndParseBackup(rawJson: string): AppBackupPayload | null {
  try {
    const parsed: unknown = JSON.parse(rawJson.trim());
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<AppBackupPayload>;

    if (
      !candidate.profile ||
      typeof candidate.profile.name !== 'string' ||
      !candidate.profile.name.trim() ||
      !Array.isArray(candidate.courses) ||
      candidate.courses.length === 0
    ) {
      return null;
    }

    const sanitizedCourses: CourseSyllabus[] = candidate.courses.filter(
      (c): c is CourseSyllabus =>
        Boolean(c) &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.examDateISO === 'string' &&
        Array.isArray(c.subjects)
    );

    if (sanitizedCourses.length === 0) return null;

    const activeIdExists = sanitizedCourses.some((c) => c.id === candidate.profile?.activeCourseId);

    return {
      version: 1,
      exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
      profile: {
        name: candidate.profile.name.trim(),
        activeCourseId: activeIdExists ? candidate.profile.activeCourseId : sanitizedCourses[0].id,
        onboarded: true,
      },
      courses: sanitizedCourses,
      milestones: Array.isArray(candidate.milestones) ? candidate.milestones : [],
      todos: Array.isArray(candidate.todos) ? candidate.todos : [],
      theme: candidate.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return null;
  }
}

export async function persistFullBackup(payload: AppBackupPayload): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.PROFILE, JSON.stringify(payload.profile)],
    [KEYS.COURSES, JSON.stringify(payload.courses)],
    [KEYS.MILESTONES, JSON.stringify(payload.milestones)],
    [KEYS.TODOS, JSON.stringify(payload.todos)],
    [KEYS.THEME, payload.theme],
  ]);
}

