
---

### 2. Core TypeScript Interfaces (`src/types/index.ts`)

```typescript
export type ThemeMode = 'dark' | 'light';

export type TabKey = 'syllabus' | 'countdown' | 'todo';

export type ExamPresetKey = 'NEET' | 'JEE' | 'UPSC' | 'CLASS_12' | 'CUSTOM';

export interface TopicItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChapterItem {
  id: string;
  title: string;
  topics: TopicItem[];
}

export interface SubjectItem {
  id: string;
  name: string;
  color: string;
  chapters: ChapterItem[];
}

export interface CourseSyllabus {
  id: string;
  name: string;
  examDateISO: string; // YYYY-MM-DD
  subjects: SubjectItem[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  courseId: string;
}

export interface TodoItem {
  id: string;
  title: string;
  subjectTag?: string;
  completed: boolean;
  createdAt: number;
}

export interface StudentProfile {
  name: string;
  activeCourseId: string;
  onboarded: boolean;
}

export interface AppBackupPayload {
  version: number;
  exportedAt: string;
  profile: StudentProfile;
  courses: CourseSyllabus[];
  milestones: MilestoneItem[];
  todos: TodoItem[];
  theme: ThemeMode;
}
