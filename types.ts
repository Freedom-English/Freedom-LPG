
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type StudentCount = 1 | 2 | 3 | 4 | 5;
export type Duration = '30 min' | '1h' | '2h' | '3h';

export interface User {
  name: string;
  email: string;
  role?: 'admin' | 'teacher';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Section {
  title: string;
  description: string;
  teacherNotes?: string;
  studentContent?: string;
  isConversation?: boolean;
  durationMinutes?: number;
  backgroundQuestions?: string[];
}

export interface AudioConfig {
  enabled: boolean;
  gender: 'male' | 'female';
  accent: 'american' | 'british';
  voiceName: string;
}

export interface LessonPlan {
  id: string;
  createdAt: number;
  authorName: string;
  title: string;
  level: CEFRLevel;
  studentCount: StudentCount;
  duration: Duration;
  grammarTopic: string;
  vocabularyFocus: string;
  isQuickLesson?: boolean;
  illustrationImage?: string; 
  quiz?: QuizQuestion[];
  sections: Section[];
  icebreaker?: string;
  closingActivity?: string;
  homework?: string;
  audioConfig?: AudioConfig;
}

export interface ExamResult {
  id: string;
  studentName: string;
  date: number;
  scores: {
    listening: number;
    reading: number;
    speaking: number;
    writing: number;
  };
  feedback: string;
}

export interface UserStats {
  totalLessons: number;
  levelDistribution: Record<CEFRLevel, number>;
  totalExams: number;
}
