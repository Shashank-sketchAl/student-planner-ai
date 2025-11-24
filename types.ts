
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: Date;
  status: TaskStatus;
  priority: Priority;
  subtasks?: SubTask[];
  isAiGenerated?: boolean;
}

export interface ClassSession {
  id: string;
  name: string;
  room: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  day: string; // Mon, Tue, etc.
  color: string; // Tailwind class base, e.g., 'blue'
}

export interface Exam {
  id: string;
  subject: string;
  date: Date;
  location: string;
}

export interface StudyTip {
  tip: string;
  category: 'Mindfulness' | 'Productivity' | 'Health';
}

export interface UserProfile {
    displayName: string;
    avatarId: string;
    email?: string;
}

export interface StudySession {
    id: string;
    userId: string;
    duration: number; // in seconds
    timestamp: Date;
    subject?: string;
}

export const AVATARS = [
    { id: 'ghost', icon: 'Ghost', color: 'indigo', label: 'Spirit' },
    { id: 'crown', icon: 'Crown', color: 'amber', label: 'Royal' },
    { id: 'zap', icon: 'Zap', color: 'blue', label: 'Energy' },
    { id: 'smile', icon: 'Smile', color: 'emerald', label: 'Vibe' },
    { id: 'star', icon: 'Star', color: 'rose', label: 'Star' },
    { id: 'rocket', icon: 'Rocket', color: 'orange', label: 'Boost' },
];

export type ViewState = 'DASHBOARD' | 'SCHEDULE' | 'ASSIGNMENTS' | 'EXAMS' | 'SETTINGS' | 'VEO' | 'WELLBEING';
