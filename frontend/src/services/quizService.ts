import { supabase } from '../utils/supabaseClient';
import type { 
  Question, 
  QuizSession, 
  QuizAttempt, 
  QuizSettings,
  Section,
  Category,
  QuizResult 
} from '../types/quiz';

export class QuizService {
  /**
   * Fetch sections with categories for quiz selection
   */
  static async getSections(): Promise<Section[]> {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id,
          category_id,
          name,
          description,
          created_at
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw new Error('Failed to fetch sections');
    }
  }

  /**
   * Fetch categories for organization
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get question count for a specific section
   */
  static async getQuestionCount(sectionId?: number): Promise<number> {
    try {
      let query = supabase
        .from('questions')
        .select('id', { count: 'exact' });

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { count, error } = await query;
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting question count:', error);
      return 0;
    }
  }

  /**
   * Fetch questions based on quiz settings
   */
  static async fetchQuestions(settings: QuizSettings): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select(`
          id,
          section_id,
          original_json,
          question_text,
          correct_answer,
          rationale,
          difficulty_level,
          tags,
          created_at,
          updated_at,
          question_options (
            id,
            question_id,
            option_key,
            option_text
          )
        `);

      // Filter by section if specified
      if (settings.sectionId) {
        query = query.eq('section_id', settings.sectionId);
      } else if (settings.sectionIds && settings.sectionIds.length > 0) {
        query = query.in('section_id', settings.sectionIds);
      }

      // For random selection, we'll use ORDER BY RANDOM() LIMIT
      // Note: This is not ideal for large datasets but works for our use case
      const { data, error } = await query
        .order('id', { ascending: false }) // Fallback ordering
        .limit(Math.min(settings.questionCount * 2, 200)); // Fetch more than needed for randomization

      if (error) throw error;

      // Transform the data to match our interface
      const questions: Question[] = (data || []).map(item => ({
        ...item,
        options: item.question_options || []
      }));

      // Randomly shuffle and limit to requested count
      const shuffled = this.shuffleArray(questions);
      return shuffled.slice(0, settings.questionCount);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }
  }

  /**
   * Create a new quiz session
   */
  static async createQuizSession(
    userId: string, 
    settings: QuizSettings
  ): Promise<QuizSession> {
    try {
      const sessionData = {
        user_id: userId,
        session_type: settings.mode === 'custom' ? 'random' : settings.mode, // Map custom to random for DB
        section_id: settings.sectionId || null,
        total_questions: settings.questionCount,
        time_limit: settings.timeLimit || null,
        score: 0
      };

      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating quiz session:', error);
      throw new Error('Failed to create quiz session');
    }
  }

  /**
   * Save a quiz attempt for a specific question
   */
  static async saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'attempted_at'>): Promise<QuizAttempt> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          session_id: attempt.session_id,
          question_id: attempt.question_id,
          selected_answer: attempt.selected_answer,
          is_correct: attempt.is_correct,
          time_taken: attempt.time_taken
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw new Error('Failed to save quiz attempt');
    }
  }

  /**
   * Complete a quiz session and calculate final score
   */
  static async completeQuizSession(sessionId: string): Promise<QuizResult> {
    try {
      // First, get all attempts for this session
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          questions!inner (
            id,
            section_id,
            question_text,
            sections!inner (
              name,
              categories!inner (
                name
              )
            )
          )
        `)
        .eq('session_id', sessionId);

      if (attemptsError) throw attemptsError;

      // Calculate score and statistics
      const totalQuestions = attempts?.length || 0;
      const correctAnswers = attempts?.filter(a => a.is_correct).length || 0;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const totalTime = attempts?.reduce((sum, a) => sum + (a.time_taken || 0), 0) || 0;

      // Calculate category breakdown
      const categoryMap = new Map<string, { correct: number; total: number; categoryName: string; sectionName: string }>();
      
      attempts?.forEach(attempt => {
        const question = attempt.questions;
        const categoryName = question.sections?.categories?.name || 'Unknown';
        const sectionName = question.sections?.name || 'Unknown';
        const key = `${categoryName}-${sectionName}`;
        
        if (!categoryMap.has(key)) {
          categoryMap.set(key, { 
            correct: 0, 
            total: 0, 
            categoryName, 
            sectionName 
          });
        }
        
        const stats = categoryMap.get(key)!;
        stats.total += 1;
        if (attempt.is_correct) {
          stats.correct += 1;
        }
      });

      const categoryBreakdown = Array.from(categoryMap.values()).map(stats => ({
        categoryName: stats.categoryName,
        sectionName: stats.sectionName,
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      }));

      // Update the session with completion data
      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          score: correctAnswers
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      return {
        sessionId,
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        accuracy,
        timeSpent: totalTime,
        categoryBreakdown,
        attempts: attempts || []
      };
    } catch (error) {
      console.error('Error completing quiz session:', error);
      throw new Error('Failed to complete quiz session');
    }
  }

  /**
   * Validate an answer and return correctness
   */
  static validateAnswer(question: Question, selectedAnswer: string): boolean {
    // Extract the letter from both the selected answer and correct answer
    // Format is typically "A) Answer text" or just "A"
    const selectedLetter = selectedAnswer.trim().charAt(0).toUpperCase();
    const correctLetter = question.correct_answer.trim().charAt(0).toUpperCase();
    
    return selectedLetter === correctLetter;
  }

  /**
   * Get quiz history for a user
   */
  static async getQuizHistory(userId: string, limit: number = 10): Promise<QuizSession[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          *,
          sections (
            name,
            categories (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      throw new Error('Failed to fetch quiz history');
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        total_sessions: 0,
        total_questions_attempted: 0,
        correct_answers: 0,
        overall_accuracy: 0,
        avg_time_per_question: 0
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  /**
   * Utility method to shuffle an array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Refresh user statistics materialized view
   */
  static async refreshUserStatistics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_user_statistics');
      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing user statistics:', error);
      // Don't throw here as this is a background operation
    }
  }
}