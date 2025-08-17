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

/**
 * QuizService - Comprehensive service for quiz-related operations
 * 
 * This service handles all quiz functionality including:
 * - Section and category management
 * - Question fetching with randomization
 * - Quiz session lifecycle (create, track, complete)
 * - Quiz attempts and scoring
 * - User statistics and history
 * 
 * All methods include proper error handling, logging, and type safety.
 */

export class QuizService {
  /**
   * Fetch sections with categories for quiz selection
   * @returns Promise<Section[]> Array of unique sections ordered by name
   * @throws Error when sections cannot be fetched
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

      if (error) {
        console.error('Database error fetching sections:', error.message);
        throw error;
      }
      
      // Remove duplicates based on name and id
      const uniqueSections = data?.reduce((acc: Section[], current) => {
        const existing = acc.find(item => item.id === current.id || item.name === current.name);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      console.log('INFO: Fetched sections successfully -', uniqueSections.length, 'unique sections');
      return uniqueSections;
    } catch (error) {
      console.error('ERROR: Failed to fetch sections -', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to fetch sections');
    }
  }

  /**
   * Fetch categories for organization
   * @returns Promise<Category[]> Array of categories ordered by name
   * @throws Error when categories cannot be fetched
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Database error fetching categories:', error.message);
        throw error;
      }
      
      console.log('INFO: Fetched categories successfully -', (data || []).length, 'categories');
      return data || [];
    } catch (error) {
      console.error('ERROR: Failed to fetch categories -', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get question count for a specific section or all sections
   * @param sectionId Optional section ID to filter by
   * @returns Promise<number> Count of questions
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
      
      if (error) {
        console.error('Database error getting question count:', error.message);
        throw error;
      }
      
      const questionCount = count || 0;
      console.log(`INFO: Question count retrieved - ${questionCount} questions${sectionId ? ` for section ${sectionId}` : ' total'}`);
      return questionCount;
    } catch (error) {
      console.error('ERROR: Failed to get question count -', error instanceof Error ? error.message : 'Unknown error');
      return 0;
    }
  }

  /**
   * Section weights for LMQB exam (150 questions)
   */
  private static readonly SECTION_WEIGHTS = {
    "Introduction to Lifestyle Medicine": 4, 
    "Fundamentals of Health Behavior Change": 10,
    "Key Clinical Processes in Lifestyle Medicine": 8, 
    "The Role of The Practitioners Health and Community Advocacy": 4, 
    "Nutrition Science Assessment and Prescription Guidelines": 26, 
    "Physical Activity Science and Prescription": 14, 
    "Emotional and Mental Health Assessment and Interventions": 10, 
    "Sleep Health Science and Interventions": 8, 
    "Managing Tobacco Cessation and other Toxic Exposures": 8, 
    "The Role of Connectedness and Positive Psychology": 8
  };

  /**
   * Fetch questions based on quiz settings with proper section weighting for LMQB exam
   * @param settings Quiz configuration settings
   * @returns Promise<Question[]> Array of weighted and randomized questions
   * @throws Error when questions cannot be fetched
   */
  static async fetchQuestions(settings: QuizSettings): Promise<Question[]> {
    try {
      // For LMQB exam with 150 questions, use section weights
      if (settings.questionCount === 150 && settings.mode === 'timed') {
        return await this.fetchWeightedExamQuestions();
      }

      // Default behavior for other quiz types - use regular question fetching
      return await this.fetchRegularQuestions(settings.questionCount);
      
    } catch (error) {
      console.error('ERROR: Failed to fetch questions -', error instanceof Error ? error.message : 'Unknown error');
      // Provide a more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch questions from database';
      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch questions for LMQB exam with proper section weighting (150 questions)
   * @returns Promise<Question[]> Array of 150 questions distributed according to section weights
   */
  private static async fetchWeightedExamQuestions(): Promise<Question[]> {
    try {
      console.log('INFO: Fetching weighted LMQB exam questions (150 total)');
      
      // First, check if we have any questions at all
      const { count, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' });
      
      if (countError) {
        console.error('Database error counting questions:', countError.message);
        throw countError;
      }
      
      if (count === 0) {
        console.error('ERROR: No questions found in database');
        throw new Error('No questions available in the database');
      }
      
      console.log(`INFO: Found ${count} total questions in database`);
      
      // Get all sections with their names
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, name');
      
      if (sectionsError) throw sectionsError;
      
      const sections = sectionsData || [];
      console.log('INFO: Available sections in database:', sections.map(s => s.name));
      
      const allQuestions: Question[] = [];
      
      // Fetch questions for each section according to weights
      for (const [sectionName, weight] of Object.entries(this.SECTION_WEIGHTS)) {
        // Find ALL sections with this name (handle duplicates)
        const matchingSections = sections.filter(s => s.name === sectionName);
        
        if (matchingSections.length === 0) {
          console.warn(`WARNING: Section "${sectionName}" not found in database`);
          console.log('Available sections:', sections.map(s => `"${s.name}"`).join(', '));
          continue;
        }
        
        console.log(`INFO: Found ${matchingSections.length} sections with name "${sectionName}": ${matchingSections.map(s => s.id).join(', ')}`);
        
        // Collect questions from all matching sections
        const sectionQuestions: Question[] = [];
        
        for (const section of matchingSections) {
          // Fetch more questions than needed for randomization across all sections
          const fetchLimit = Math.max(weight * 2, 20); // Fetch extra for better randomization
          
          const { data, error } = await supabase
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
            `)
            .eq('section_id', section.id)
            .limit(fetchLimit);
          
          if (error) {
            console.error(`Database error fetching questions for section ${sectionName} (ID: ${section.id}):`, error.message);
            continue;
          }
          
          if (data && data.length > 0) {
            const transformedQuestions: Question[] = data.map(item => ({
              ...item,
              options: item.question_options || []
            }));
            
            sectionQuestions.push(...transformedQuestions);
            console.log(`INFO: Fetched ${data.length} questions from section "${sectionName}" (ID: ${section.id})`);
          }
        }
        
        if (sectionQuestions.length === 0) {
          console.warn(`WARNING: No questions found for any sections named "${sectionName}"`);
          continue;
        }
        
        // Randomize all questions from this section name and select the required amount
        const shuffledSectionQuestions = this.shuffleArray(sectionQuestions);
        const selectedQuestions = shuffledSectionQuestions.slice(0, weight);
        
        console.log(`INFO: Selected ${selectedQuestions.length} questions from "${sectionName}" (weight: ${weight}, total available: ${sectionQuestions.length})`);
        allQuestions.push(...selectedQuestions);
      }
      
      console.log(`INFO: Total questions collected from weighted approach: ${allQuestions.length}`);
      
      // If we didn't get enough questions from weighted approach, try fallback strategies
      if (allQuestions.length < 100) { // Lowered threshold to be more permissive
        console.warn(`WARNING: Only got ${allQuestions.length} questions from weighted approach, attempting fallback`);
        
        // Strategy 1: Try to get additional questions from all sections
        try {
          const additionalNeeded = 150 - allQuestions.length;
          console.log(`INFO: Trying to fetch ${additionalNeeded} additional questions`);
          const additionalQuestions = await this.fetchRegularQuestions(additionalNeeded);
          
          // Remove duplicates by ID
          const existingIds = new Set(allQuestions.map(q => q.id));
          const nonDuplicateAdditional = additionalQuestions.filter(q => !existingIds.has(q.id));
          
          allQuestions.push(...nonDuplicateAdditional);
          console.log(`INFO: Added ${nonDuplicateAdditional.length} additional questions (after removing duplicates)`);
        } catch (fallbackError) {
          console.error('ERROR: Fallback question fetch failed:', fallbackError);
        }
        
        // Strategy 2: If still not enough, fall back completely to regular fetch
        if (allQuestions.length < 50) {
          console.warn(`WARNING: Still only have ${allQuestions.length} questions, falling back to complete regular fetch`);
          return await this.fetchRegularQuestions(150);
        }
      }
      
      // Final shuffle to randomize question order across sections
      const finalQuestions = this.shuffleArray(allQuestions);
      
      console.log(`INFO: LMQB exam questions prepared - ${finalQuestions.length} total questions`);
      
      // Take up to 150 questions (or whatever we have)
      const examQuestions = finalQuestions.slice(0, Math.min(150, finalQuestions.length));
      
      if (examQuestions.length < 150) {
        console.warn(`WARNING: Exam has ${examQuestions.length} questions instead of 150`);
      }
      
      return examQuestions;
      
    } catch (error) {
      console.error('ERROR: Failed to fetch weighted exam questions -', error instanceof Error ? error.message : 'Unknown error');
      // Fallback to regular question fetching
      try {
        console.log('INFO: Falling back to regular question fetching');
        return await this.fetchRegularQuestions(150);
      } catch (fallbackError) {
        console.error('ERROR: Fallback question fetch also failed -', fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
        throw new Error('Failed to fetch exam questions');
      }
    }
  }

  /**
   * Fetch regular questions without section weighting (fallback method)
   * @param count Number of questions to fetch
   * @returns Promise<Question[]> Array of questions
   */
  private static async fetchRegularQuestions(count: number): Promise<Question[]> {
    try {
      // First check if we have any questions at all
      const { count: totalCount, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' });
      
      if (countError) {
        console.error('Database error counting questions:', countError.message);
        throw countError;
      }
      
      if (totalCount === 0) {
        console.error('ERROR: No questions found in database');
        throw new Error('The database contains no questions. Please contact your administrator to load the question bank.');
      }
      
      console.log(`INFO: Found ${totalCount} total questions in database`);
      
      const { data, error } = await supabase
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
        `)
        .order('id', { ascending: false })
        .limit(Math.min(count * 2, totalCount)); // Fetch extra for randomization but don't exceed total

      if (error) {
        console.error('Database error fetching questions:', error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('ERROR: No questions returned from database despite count > 0');
        throw new Error('Unable to retrieve questions from the database. Please contact your administrator.');
      }

      // Transform data to match Question interface
      const questions: Question[] = data.map(item => ({
        ...item,
        options: item.question_options || []
      }));

      // Randomize and limit to requested count
      const shuffled = this.shuffleArray(questions);
      const selectedQuestions = shuffled.slice(0, Math.min(count, questions.length));
      
      console.log(`INFO: Regular questions fetched - ${selectedQuestions.length} of ${count} requested (${totalCount} total available)`);
      return selectedQuestions;
      
    } catch (error) {
      console.error('ERROR: Failed to fetch regular questions -', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Create a new quiz session in the database
   * @param userId User identifier
   * @param settings Quiz configuration settings
   * @returns Promise<QuizSession> Created quiz session
   * @throws Error when session cannot be created
   */
  static async createQuizSession(
    userId: string, 
    settings: QuizSettings
  ): Promise<QuizSession> {
    try {
      // Determine session type - use 'timed' for LMQB exam sessions
      const sessionType = settings.mode === 'custom' ? 'random' : settings.mode;
      
      const sessionData = {
        user_id: userId,
        session_type: sessionType,
        section_id: settings.sectionIds && settings.sectionIds.length === 1 ? settings.sectionIds[0] : 
                   settings.sectionId || null, // Use single section if only one selected, otherwise null for multi-section
        total_questions: settings.questionCount,
        time_limit: settings.timeLimit || null,
        score: 0
      };

      console.log('INFO: Creating quiz session for user:', userId, 'with settings:', {
        type: sessionData.session_type,
        questions: sessionData.total_questions,
        section: sessionData.section_id,
        timeLimit: sessionData.time_limit
      });

      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating quiz session:', error.message);
        throw error;
      }
      
      console.log('INFO: Quiz session created successfully with ID:', data.id);
      return data;
    } catch (error) {
      console.error('ERROR: Failed to create quiz session -', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to create quiz session');
    }
  }

  /**
   * Save a quiz attempt for a specific question
   * @param attempt Quiz attempt data without id and timestamp
   * @returns Promise<QuizAttempt> Saved quiz attempt with generated id
   * @throws Error when attempt cannot be saved
   */
  static async saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'attempted_at'>): Promise<QuizAttempt> {
    try {
      const attemptData = {
        session_id: attempt.session_id,
        question_id: attempt.question_id,
        selected_answer: attempt.selected_answer,
        is_correct: attempt.is_correct,
        time_taken: attempt.time_taken
      };

      console.log('INFO: Saving quiz attempt - Question:', attempt.question_id, 'Correct:', attempt.is_correct);

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert(attemptData)
        .select()
        .single();

      if (error) {
        console.error('Database error saving quiz attempt:', error.message);
        throw error;
      }
      
      console.log('INFO: Quiz attempt saved successfully with ID:', data.id);
      return data;
    } catch (error) {
      console.error('ERROR: Failed to save quiz attempt -', error instanceof Error ? error.message : 'Unknown error');
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
      console.error('ERROR: Failed to complete quiz session -', error instanceof Error ? error.message : 'Unknown error');
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
   * Get quiz history for a user with section information
   * @param userId User identifier
   * @param limit Maximum number of sessions to retrieve
   * @returns Promise<QuizSession[]> Array of quiz sessions ordered by most recent
   * @throws Error when quiz history cannot be fetched
   */
  static async getQuizHistory(userId: string, limit: number = 10): Promise<QuizSession[]> {
    try {
      console.log(`INFO: Fetching quiz history for user ${userId} (limit: ${limit})`);
      
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

      if (error) {
        console.error('Database error fetching quiz history:', error.message);
        throw error;
      }
      
      const sessions = data || [];
      console.log(`INFO: Quiz history fetched successfully - ${sessions.length} sessions`);
      return sessions;
    } catch (error) {
      console.error('ERROR: Failed to fetch quiz history -', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to fetch quiz history');
    }
  }

  /**
   * Get user statistics from materialized view
   * @param userId User identifier
   * @returns Promise<UserStatistics> User statistics or default empty stats
   * @throws Error when statistics cannot be fetched
   */
  static async getUserStatistics(userId: string) {
    try {
      console.log(`INFO: Fetching user statistics for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      // PGRST116 is "not found" which is acceptable for new users
      if (error && error.code !== 'PGRST116') {
        console.error('Database error fetching user statistics:', error.message);
        throw error;
      }
      
      const defaultStats = {
        total_sessions: 0,
        total_questions_attempted: 0,
        correct_answers: 0,
        overall_accuracy: 0,
        avg_time_per_question: 0
      };
      
      const stats = data || defaultStats;
      console.log(`INFO: User statistics retrieved - Accuracy: ${stats.overall_accuracy}%, Sessions: ${stats.total_sessions}`);
      return stats;
    } catch (error) {
      console.error('ERROR: Failed to fetch user statistics -', error instanceof Error ? error.message : 'Unknown error');
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
   * Refresh user statistics materialized view (background operation)
   * @returns Promise<void> - Does not throw errors to avoid disrupting user flow
   */
  static async refreshUserStatistics(): Promise<void> {
    try {
      console.log('INFO: Refreshing user statistics materialized view');
      
      const { error } = await supabase.rpc('refresh_user_statistics');
      
      if (error) {
        console.error('Database error refreshing user statistics:', error.message);
        return; // Don't throw as this is a background operation
      }
      
      console.log('INFO: User statistics materialized view refreshed successfully');
    } catch (error) {
      console.error('ERROR: Failed to refresh user statistics -', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw here as this is a background operation that shouldn't disrupt user flow
    }
  }
}