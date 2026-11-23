import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SyllabusTopic,
  StudyStatus,
  getNextStudyStatus,
  calculateCompletionPercent,
  groupBreakdownBySubject,
  filterSyllabusTopics,
} from '../utils/syllabusProgress';

const SYLLABUS_STORAGE_KEY = '@studypulse_syllabus_v1';

export function normalizeTopics(raw: any[]): SyllabusTopic[] {
  if (!Array.isArray(raw)) return [];
  const validStatuses: StudyStatus[] = [
    'not_started',
    'in_progress',
    'needs_revision',
    'mastered',
  ];

  return raw.map((item, index) => {
    let status: StudyStatus = 'not_started';
    if (validStatuses.includes(item?.status)) {
      status = item.status;
    } else if (item?.completed === true) {
      status = 'mastered';
    }

    return {
      id: String(item?.id ?? `topic-${index}`),
      subject: String(item?.subject ?? 'General'),
      chapter: String(item?.chapter ?? 'Chapter 1'),
      title: String(item?.title ?? 'Untitled Topic'),
      status,
    };
  });
}
