mkdir -p src/utils && cat << 'EOF' > src/utils/syllabusProgress.ts
export type StudyStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_revision'
  | 'mastered';

export interface SyllabusTopic {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  status: StudyStatus;
}

export const STUDY_STATUS_ORDER: StudyStatus[] = [
  'not_started',
  'in_progress',
  'needs_revision',
  'mastered',
];

export const STUDY_STATUS_META: Record<
  StudyStatus,
  { label: string; shortLabel: string; weight: number; accent: string }
> = {
  not_started: {
    label: 'Not Started',
    shortLabel: 'Todo',
    weight: 0,
    accent: '#6B7280',
  },
  in_progress: {
    label: 'In Progress',
    shortLabel: 'Active',
    weight: 0.4,
    accent: '#3B82F6',
  },
  needs_revision: {
    label: 'Needs Revision',
    shortLabel: 'Revise',
    weight: 0.75,
    accent: '#F59E0B',
  },
  mastered: {
    label: 'Mastered',
    shortLabel: 'Done',
    weight: 1,
    accent: '#10B981',
  },
};

export function getNextStudyStatus(current: StudyStatus): StudyStatus {
  const idx = STUDY_STATUS_ORDER.indexOf(current);
  return STUDY_STATUS_ORDER[(idx + 1) % STUDY_STATUS_ORDER.length];
}

export function calculateCompletionPercent(topics: SyllabusTopic[]): number {
  if (!topics.length) return 0;
  const totalWeight = topics.reduce(
    (sum, item) => sum + STUDY_STATUS_META[item.status].weight,
    0
  );
  return Math.round((totalWeight / topics.length) * 100);
}

export function groupBreakdownBySubject(topics: SyllabusTopic[]) {
  const map = new Map<
    string,
    { subject: string; total: number; mastered: number; percent: number }
  >();

  for (const t of topics) {
    const entry = map.get(t.subject) ?? {
      subject: t.subject,
      total: 0,
      mastered: 0,
      percent: 0,
    };
    entry.total += 1;
    if (t.status === 'mastered') entry.mastered += 1;
    map.set(t.subject, entry);
  }

  return Array.from(map.values()).map((entry) => {
    const subjectTopics = topics.filter((x) => x.subject === entry.subject);
    return {
      ...entry,
      percent: calculateCompletionPercent(subjectTopics),
    };
  });
}

export function filterSyllabusTopics(
  topics: SyllabusTopic[],
  opts: {
    query?: string;
    subject?: string; // 'ALL' or specific subject
    status?: StudyStatus | 'ALL';
  }
): SyllabusTopic[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  const subject = opts.subject ?? 'ALL';
  const status = opts.status ?? 'ALL';

  return topics.filter((item) => {
    const matchesSubject = subject === 'ALL' || item.subject === subject;
    const matchesStatus = status === 'ALL' || item.status === status;
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.chapter.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q);
    return matchesSubject && matchesStatus && matchesQuery;
  });
}
EOF
