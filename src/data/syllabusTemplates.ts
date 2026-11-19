import { CourseSyllabus, ExamPresetKey, SubjectItem } from '../types';

export interface ExamPresetOption {
  key: ExamPresetKey;
  label: string;
  subtitle: string;
  defaultOffsetDays: number;
}

export const EXAM_PRESETS: ExamPresetOption[] = [
  {
    key: 'NEET',
    label: 'NEET UG',
    subtitle: 'Physics, Chemistry & Biology',
    defaultOffsetDays: 150,
  },
  {
    key: 'JEE',
    label: 'JEE Main & Adv',
    subtitle: 'Physics, Chemistry & Mathematics',
    defaultOffsetDays: 120,
  },
  {
    key: 'UPSC',
    label: 'UPSC CSE',
    subtitle: 'GS Prelims & CSAT Core Modules',
    defaultOffsetDays: 180,
  },
  {
    key: 'CLASS_12',
    label: 'Class 12 Boards',
    subtitle: 'PCM / Core Board Curriculum',
    defaultOffsetDays: 90,
  },
  {
    key: 'CUSTOM',
    label: 'Custom Exam',
    subtitle: 'Define your own exam or semester',
    defaultOffsetDays: 60,
  },
];

const RAW_TEMPLATES: Record<Exclude<ExamPresetKey, 'CUSTOM'>, Array<{
  name: string;
  color: string;
  chapters: Array<{ title: string; topics: string[] }>;
}>> = {
  NEET: [
    {
      name: 'Biology',
      color: '#34D399',
      chapters: [
        {
          title: 'Cell: Structure and Function',
          topics: ['Cell Theory & Prokaryotes', 'Eukaryotic Organelles', 'Biomolecules & Enzymes', 'Cell Cycle & Mitosis', 'Meiosis'],
        },
        {
          title: 'Human Physiology',
          topics: ['Breathing & Gas Exchange', 'Body Fluids & Circulation', 'Excretory Products', 'Neural Control & Coordination', 'Chemical Coordination'],
        },
        {
          title: 'Genetics & Evolution',
          topics: ['Principles of Inheritance', 'Molecular Basis of Inheritance', 'DNA Replication & Transcription', 'Evolutionary Mechanisms'],
        },
      ],
    },
    {
      name: 'Physics',
      color: '#38BDF8',
      chapters: [
        {
          title: 'Mechanics',
          topics: ['Units & Measurements', 'Kinematics in 1D & 2D', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion'],
        },
        {
          title: 'Electrodynamics',
          topics: ['Electrostatics & Gauss Law', 'Current Electricity', 'Moving Charges & Magnetism', 'Electromagnetic Induction'],
        },
      ],
    },
    {
      name: 'Chemistry',
      color: '#FBBF24',
      chapters: [
        {
          title: 'Physical Chemistry',
          topics: ['Atomic Structure', 'Chemical Thermodynamics', 'Chemical & Ionic Equilibrium', 'Electrochemistry'],
        },
        {
          title: 'Organic Chemistry',
          topics: ['General Organic Chemistry (GOC)', 'Hydrocarbons', 'Aldehydes, Ketones & Carboxylic Acids', 'Biomolecules'],
        },
      ],
    },
  ],
  JEE: [
    {
      name: 'Mathematics',
      color: '#A78BFA',
      chapters: [
        {
          title: 'Calculus',
          topics: ['Limits, Continuity & Differentiability', 'Applications of Derivatives', 'Indefinite & Definite Integration', 'Differential Equations'],
        },
        {
          title: 'Algebra & Coordinate Geometry',
          topics: ['Complex Numbers & Quadratics', 'Matrices & Determinants', 'Straight Lines & Circles', 'Conic Sections', 'Vectors & 3D Geometry'],
        },
      ],
    },
    {
      name: 'Physics',
      color: '#38BDF8',
      chapters: [
        {
          title: 'Mechanics & Gravitation',
          topics: ['Kinematics', 'Newtonian Mechanics & Friction', 'Center of Mass & Collisions', 'Rigid Body Dynamics', 'Gravitation'],
        },
        {
          title: 'Optics & Modern Physics',
          topics: ['Ray Optics & Instruments', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms & Nuclei'],
        },
      ],
    },
    {
      name: 'Chemistry',
      color: '#34D399',
      chapters: [
        {
          title: 'Inorganic & Coordination',
          topics: ['Chemical Bonding & MOT', 'Periodic Properties', 'Coordination Compounds', 'd & f Block Elements'],
        },
        {
          title: 'Organic & Physical',
          topics: ['Chemical Kinetics', 'Solutions & Colligative Properties', 'Reaction Mechanisms & Stereochemistry', 'Amines & Haloalkanes'],
        },
      ],
    },
  ],
  UPSC: [
    {
      name: 'Indian Polity & Governance',
      color: '#38BDF8',
      chapters: [
        {
          title: 'Constitutional Framework',
          topics: ['Historical Underpinnings & Making', 'Preamble & Salient Features', 'Fundamental Rights & DPSP', 'Fundamental Duties'],
        },
        {
          title: 'System of Government',
          topics: ['Parliamentary System & Federalism', 'President, PM & Council of Ministers', 'Supreme Court & Judicial Review', 'Panchayati Raj & Municipalities'],
        },
      ],
    },
    {
      name: 'Modern History & Culture',
      color: '#FBBF24',
      chapters: [
        {
          title: 'Indian National Movement',
          topics: ['Revolt of 1857 & Socio-Religious Reforms', 'Moderates, Extremists & Swadeshi', 'Gandhian Era & Non-Cooperation', 'Civil Disobedience & Quit India'],
        },
        {
          title: 'Art & Culture',
          topics: ['Indian Architecture & Sculpture', 'Classical Dances & Music', 'Literature & Philosophy'],
        },
      ],
    },
    {
      name: 'Economy & Environment',
      color: '#34D399',
      chapters: [
        {
          title: 'Indian Economy',
          topics: ['National Income & Monetary Policy', 'Banking, Inflation & Fiscal Policy', 'Budget, Taxation & External Sector'],
        },
        {
          title: 'Ecology & Biodiversity',
          topics: ['Ecosystems & Protected Areas', 'Climate Change Conventions', 'Environmental Impact Assessment'],
        },
      ],
    },
  ],
  CLASS_12: [
    {
      name: 'Physics',
      color: '#38BDF8',
      chapters: [
        {
          title: 'Electrostatics & Current',
          topics: ['Electric Charges & Fields', 'Electrostatic Potential & Capacitance', 'Current Electricity'],
        },
        {
          title: 'Magnetism & Optics',
          topics: ['Moving Charges & Magnetism', 'Electromagnetic Waves', 'Ray & Wave Optics', 'Semiconductor Electronics'],
        },
      ],
    },
    {
      name: 'Chemistry',
      color: '#34D399',
      chapters: [
        {
          title: 'Physical & Inorganic',
          topics: ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Coordination Compounds'],
        },
        {
          title: 'Organic Chemistry',
          topics: ['Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers', 'Aldehydes & Ketones', 'Amines & Biomolecules'],
        },
      ],
    },
    {
      name: 'Mathematics',
      color: '#A78BFA',
      chapters: [
        {
          title: 'Relations, Matrices & Calculus',
          topics: ['Relations & Functions', 'Matrices & Determinants', 'Continuity & Differentiability', 'Integrals & Applications', 'Probability'],
        },
      ],
    },
  ],
};

let uidCounter = 0;
export function createId(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now()}_${uidCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getFutureDateISO(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function cloneTemplateSyllabus(
  presetKey: ExamPresetKey,
  courseName: string,
  examDateISO: string,
  usePreloaded: boolean
): CourseSyllabus {
  const subjects: SubjectItem[] =
    !usePreloaded || presetKey === 'CUSTOM'
      ? []
      : RAW_TEMPLATES[presetKey].map((subj) => ({
          id: createId('subj'),
          name: subj.name,
          color: subj.color,
          chapters: subj.chapters.map((chap) => ({
            id: createId('chap'),
            title: chap.title,
            topics: chap.topics.map((topicTitle) => ({
              id: createId('top'),
              title: topicTitle,
              completed: false,
            })),
          })),
        }));

  return {
    id: createId('course'),
    name: courseName.trim() || 'My Target Exam',
    examDateISO,
    subjects,
  };
}

