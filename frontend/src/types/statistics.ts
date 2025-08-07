// Statistics types for the LMQB application

export interface UserStatistics {
  user_id: string;
  total_questions: number;
  total_correct: number;
  accuracy_percentage: number;
  avg_time_per_question: number;
  total_time_spent: number;
  sections_attempted: number;
  last_quiz_date: string | null;
  total_sessions: number;
  current_streak: number;
  best_streak: number;
  study_days: number;
}

export interface SectionStatistics {
  section_id: number;
  section_name: string;
  category_name: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
  avg_time_per_question: number;
  total_time_spent: number;
  difficulty_level: 'needs-practice' | 'developing' | 'proficient' | 'mastery';
  last_attempted: string | null;
  improvement_trend: 'improving' | 'stable' | 'declining' | 'insufficient-data';
}

export interface RecentSession {
  id: string;
  session_type: 'random' | 'section' | 'timed';
  section_name: string | null;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  score: number;
  accuracy: number;
  time_taken: number; // in seconds
  time_limit: number | null; // in minutes
  performance_level: 'excellent' | 'good' | 'needs-improvement';
}

export interface ProgressOverTime {
  date: string;
  accuracy: number;
  questions_attempted: number;
  time_spent: number; // in seconds
  sessions_completed: number;
}

export interface StudyRecommendation {
  type: 'weakness' | 'strength' | 'practice' | 'consistency' | 'time-management';
  title: string;
  description: string;
  section_id?: number;
  section_name?: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface ComparativeStats {
  user_accuracy: number;
  average_accuracy: number;
  user_questions_per_session: number;
  average_questions_per_session: number;
  user_time_per_question: number;
  average_time_per_question: number;
  user_percentile: number;
  total_users: number;
}

export interface StatisticsOverview {
  overall: UserStatistics;
  sections: SectionStatistics[];
  recentSessions: RecentSession[];
  progressOverTime: ProgressOverTime[];
  recommendations: StudyRecommendation[];
  comparative?: ComparativeStats;
  lastUpdated: string;
}

export interface StatisticsFilters {
  dateRange: {
    start?: string;
    end?: string;
  };
  sections?: number[];
  sessionTypes?: ('random' | 'section' | 'timed')[];
  limit?: number;
}

// Store state interface
export interface StatisticsState {
  // Data
  statistics: StatisticsOverview | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Cache management
  lastFetch: number | null;
  cacheExpiry: number; // in milliseconds (default 5 minutes)
  
  // Filters
  filters: StatisticsFilters;
}

// API response types
export interface StatisticsApiResponse {
  success: boolean;
  data?: StatisticsOverview;
  error?: string;
  cached?: boolean;
}

// Event types for real-time updates
export interface StatisticsUpdateEvent {
  type: 'quiz_completed' | 'session_started' | 'daily_stats_refresh';
  user_id: string;
  session_id?: string;
  data?: Partial<StatisticsOverview>;
}