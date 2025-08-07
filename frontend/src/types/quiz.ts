// Database-aligned interfaces
export interface Question {
  id: number;
  section_id: number;
  original_json: Record<string, any>;
  question_text: string;
  correct_answer: string;
  rationale: string | null;
  difficulty_level: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_key: string; // A, B, C, D, E
  option_text: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  session_type: 'random' | 'section' | 'timed';
  section_id?: number | null;
  total_questions: number;
  time_limit?: number | null; // in minutes
  started_at: string;
  completed_at?: string | null;
  score: number | null;
}

export interface QuizAttempt {
  id: string;
  session_id: string;
  question_id: number;
  selected_answer?: string | null;
  is_correct?: boolean | null;
  time_taken: number; // in seconds
  attempted_at: string;
}

export interface QuizResult {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  categoryBreakdown: CategoryResult[];
  attempts: QuizAttempt[];
}

export interface CategoryResult {
  categoryName: string;
  sectionName: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface Section {
  id: number;
  category_id: number | null;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

// Frontend-specific interfaces
export interface QuizSettings {
  mode: QuizMode;
  sectionId?: number;
  questionCount: number;
  timeLimit?: number;
}

export interface QuizState {
  // Current session data
  currentSession: QuizSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<number, string>; // questionId -> selectedAnswer
  attempts: QuizAttempt[];
  
  // Timer state (for timed mode)
  timeRemaining?: number; // in seconds
  timerActive: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showRationale: boolean;
  quizCompleted: boolean;
  
  // Results
  result: QuizResult | null;
}

export type QuizMode = 'random' | 'section' | 'timed';

// Helper types for question processing
export interface ProcessedQuestion extends Omit<Question, 'options'> {
  options: QuestionOption[];
  selectedAnswer?: string;
  isAnswered: boolean;
  isCorrect?: boolean;
}