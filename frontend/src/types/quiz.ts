export interface Question {
  id: number;
  sectionId: number;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  rationale: string;
  difficultyLevel: number;
  tags: string[];
  originalJson: Record<string, any>; // Preserved original structure
}

export interface QuestionOption {
  key: string; // A, B, C, D, E
  text: string;
}

export interface QuizSession {
  id: string;
  userId: string;
  sessionType: 'random' | 'section' | 'timed';
  sectionId?: number;
  totalQuestions: number;
  timeLimit?: number; // in minutes
  startedAt: string;
  completedAt?: string;
  score: number;
  questions: Question[];
  currentQuestionIndex: number;
}

export interface QuizAttempt {
  id: string;
  sessionId: string;
  questionId: number;
  selectedAnswer?: string;
  isCorrect?: boolean;
  timeTaken: number; // in seconds
  attemptedAt: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number;
  categoryBreakdown: CategoryResult[];
}

export interface CategoryResult {
  categoryName: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface Section {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  sections: Section[];
}

export type QuizMode = 'random' | 'section' | 'timed';