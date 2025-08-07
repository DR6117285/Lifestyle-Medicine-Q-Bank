import { supabase } from '../utils/supabaseClient';
import type {
  UserStatistics,
  SectionStatistics,
  RecentSession,
  ProgressOverTime,
  StudyRecommendation,
  ComparativeStats,
  StatisticsOverview,
  StatisticsFilters,
  StatisticsApiResponse
} from '../types/statistics';

export class StatisticsService {
  /**
   * Fetch comprehensive statistics for a user
   */
  static async getUserStatistics(
    userId: string,
    filters?: StatisticsFilters
  ): Promise<StatisticsApiResponse> {
    try {
      // Parallel fetch of all statistics components
      const [
        overallStats,
        sectionStats,
        recentSessions,
        progressData,
        comparativeStats
      ] = await Promise.all([
        this.getOverallStatistics(userId),
        this.getSectionStatistics(userId, filters),
        this.getRecentSessions(userId, filters?.limit || 10),
        this.getProgressOverTime(userId, filters?.dateRange),
        this.getComparativeStatistics(userId)
      ]);

      const recommendations = this.generateRecommendations(
        overallStats,
        sectionStats
      );

      const statistics: StatisticsOverview = {
        overall: overallStats,
        sections: sectionStats,
        recentSessions,
        progressOverTime: progressData,
        recommendations,
        comparative: comparativeStats,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Get overall user statistics from materialized view
   */
  private static async getOverallStatistics(userId: string): Promise<UserStatistics> {
    try {
      // First try to get from materialized view
      const { data: materializedData, error: materializedError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (materializedData && !materializedError) {
        // Calculate additional metrics not in materialized view
        const additionalData = await this.getAdditionalOverallStats(userId);
        
        return {
          ...materializedData,
          ...additionalData
        };
      }

      // Fallback to calculated statistics if materialized view is empty
      return await this.calculateOverallStatistics(userId);
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      return this.getEmptyOverallStats(userId);
    }
  }

  /**
   * Calculate overall statistics from raw data (fallback)
   */
  private static async calculateOverallStatistics(userId: string): Promise<UserStatistics> {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          is_correct,
          time_taken,
          attempted_at,
          quiz_sessions!inner (
            user_id,
            started_at
          )
        `)
        .eq('quiz_sessions.user_id', userId);

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        return this.getEmptyOverallStats(userId);
      }

      const totalQuestions = attempts.length;
      const totalCorrect = attempts.filter(a => a.is_correct).length;
      const accuracyPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0);
      const avgTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

      // Get session count and study days
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id, started_at, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const totalSessions = sessions?.length || 0;
      const studyDays = new Set(
        sessions?.map(s => s.started_at?.split('T')[0]).filter(Boolean)
      ).size;

      // Get section count
      const { data: sectionsData } = await supabase
        .from('quiz_attempts')
        .select('questions!inner(section_id), quiz_sessions!inner(user_id)')
        .eq('quiz_sessions.user_id', userId);

      const sectionsAttempted = new Set(
        sectionsData?.map(a => a.questions?.section_id).filter(Boolean)
      ).size;

      const streak = await this.calculateCurrentStreak(userId);

      return {
        user_id: userId,
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        accuracy_percentage: accuracyPercentage,
        avg_time_per_question: avgTimePerQuestion,
        total_time_spent: totalTimeSpent,
        sections_attempted: sectionsAttempted,
        last_quiz_date: sessions?.[0]?.completed_at || null,
        total_sessions: totalSessions,
        current_streak: streak.current,
        best_streak: streak.best,
        study_days: studyDays
      };
    } catch (error) {
      console.error('Error calculating overall statistics:', error);
      return this.getEmptyOverallStats(userId);
    }
  }

  /**
   * Get additional stats not in materialized view
   */
  private static async getAdditionalOverallStats(userId: string) {
    try {
      const [streakData, studyDaysData, sessionCountData] = await Promise.all([
        this.calculateCurrentStreak(userId),
        this.calculateStudyDays(userId),
        this.getSessionCount(userId)
      ]);

      return {
        current_streak: streakData.current,
        best_streak: streakData.best,
        study_days: studyDaysData,
        total_sessions: sessionCountData
      };
    } catch (error) {
      console.error('Error fetching additional stats:', error);
      return {
        current_streak: 0,
        best_streak: 0,
        study_days: 0,
        total_sessions: 0
      };
    }
  }

  /**
   * Get section-level statistics
   */
  private static async getSectionStatistics(
    userId: string,
    filters?: StatisticsFilters
  ): Promise<SectionStatistics[]> {
    try {
      let query = supabase
        .from('quiz_attempts')
        .select(`
          is_correct,
          time_taken,
          attempted_at,
          questions!inner (
            section_id,
            sections!inner (
              id,
              name,
              categories (
                name
              )
            )
          ),
          quiz_sessions!inner (
            user_id
          )
        `)
        .eq('quiz_sessions.user_id', userId);

      // Apply filters
      if (filters?.sections?.length) {
        query = query.in('questions.section_id', filters.sections);
      }

      if (filters?.dateRange?.start) {
        query = query.gte('attempted_at', filters.dateRange.start);
      }

      if (filters?.dateRange?.end) {
        query = query.lte('attempted_at', filters.dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by section and calculate statistics
      const sectionMap = new Map<number, {
        section_id: number;
        section_name: string;
        category_name: string;
        attempts: typeof data;
      }>();

      data?.forEach(attempt => {
        const section = attempt.questions?.sections;
        if (!section) return;

        const sectionId = section.id;
        const sectionName = section.name;
        const categoryName = section.categories?.name || 'Uncategorized';

        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            section_id: sectionId,
            section_name: sectionName,
            category_name: categoryName,
            attempts: []
          });
        }

        sectionMap.get(sectionId)!.attempts.push(attempt);
      });

      // Calculate statistics for each section
      const sectionStats: SectionStatistics[] = [];
      
      for (const [sectionId, data] of sectionMap) {
        const attempts = data.attempts;
        const questionsAttempted = attempts.length;
        const correctAnswers = attempts.filter(a => a.is_correct).length;
        const accuracyPercentage = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
        const totalTime = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0);
        const avgTimePerQuestion = questionsAttempted > 0 ? totalTime / questionsAttempted : 0;
        
        // Sort attempts by date for trend analysis
        const sortedAttempts = attempts.sort((a, b) => 
          new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime()
        );

        const lastAttempted = sortedAttempts[sortedAttempts.length - 1]?.attempted_at || null;
        const improvementTrend = this.calculateImprovementTrend(sortedAttempts);
        const difficultyLevel = this.getDifficultyLevel(accuracyPercentage);

        sectionStats.push({
          section_id: sectionId,
          section_name: data.section_name,
          category_name: data.category_name,
          questions_attempted: questionsAttempted,
          correct_answers: correctAnswers,
          accuracy_percentage: accuracyPercentage,
          avg_time_per_question: avgTimePerQuestion,
          total_time_spent: totalTime,
          difficulty_level: difficultyLevel,
          last_attempted: lastAttempted,
          improvement_trend: improvementTrend
        });
      }

      // Sort by accuracy (lowest first to highlight areas needing work)
      return sectionStats.sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
    } catch (error) {
      console.error('Error fetching section statistics:', error);
      return [];
    }
  }

  /**
   * Get recent quiz sessions
   */
  private static async getRecentSessions(
    userId: string,
    limit: number = 10
  ): Promise<RecentSession[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          id,
          session_type,
          started_at,
          completed_at,
          total_questions,
          score,
          time_limit,
          sections (
            name
          )
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(session => {
        const accuracy = session.total_questions > 0 ? 
          (session.score / session.total_questions) * 100 : 0;
        
        // Calculate time taken
        const startTime = new Date(session.started_at).getTime();
        const endTime = new Date(session.completed_at!).getTime();
        const timeTaken = Math.floor((endTime - startTime) / 1000); // in seconds

        const performanceLevel = accuracy >= 80 ? 'excellent' : 
          accuracy >= 70 ? 'good' : 'needs-improvement';

        return {
          id: session.id,
          session_type: session.session_type,
          section_name: session.sections?.name || null,
          started_at: session.started_at,
          completed_at: session.completed_at!,
          total_questions: session.total_questions,
          score: session.score,
          accuracy,
          time_taken: timeTaken,
          time_limit: session.time_limit,
          performance_level: performanceLevel
        };
      });
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }

  /**
   * Get progress over time data
   */
  private static async getProgressOverTime(
    userId: string,
    dateRange?: { start?: string; end?: string }
  ): Promise<ProgressOverTime[]> {
    try {
      let query = supabase
        .from('quiz_sessions')
        .select(`
          started_at,
          completed_at,
          total_questions,
          score
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      // Apply date range (default to last 30 days)
      const endDate = dateRange?.end || new Date().toISOString();
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      query = query
        .gte('started_at', startDate)
        .lte('started_at', endDate)
        .order('started_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Group sessions by date
      const dailyMap = new Map<string, {
        accuracy: number[];
        totalQuestions: number;
        timeSpent: number;
        sessionsCount: number;
      }>();

      data?.forEach(session => {
        const date = session.started_at.split('T')[0];
        const accuracy = session.total_questions > 0 ? 
          (session.score / session.total_questions) * 100 : 0;
        
        const startTime = new Date(session.started_at).getTime();
        const endTime = new Date(session.completed_at).getTime();
        const timeSpent = Math.floor((endTime - startTime) / 1000);

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            accuracy: [],
            totalQuestions: 0,
            timeSpent: 0,
            sessionsCount: 0
          });
        }

        const dayData = dailyMap.get(date)!;
        dayData.accuracy.push(accuracy);
        dayData.totalQuestions += session.total_questions;
        dayData.timeSpent += timeSpent;
        dayData.sessionsCount += 1;
      });

      // Convert to array and calculate averages
      const progressData: ProgressOverTime[] = [];
      
      for (const [date, data] of dailyMap) {
        const avgAccuracy = data.accuracy.length > 0 ? 
          data.accuracy.reduce((sum, acc) => sum + acc, 0) / data.accuracy.length : 0;

        progressData.push({
          date,
          accuracy: Math.round(avgAccuracy * 100) / 100,
          questions_attempted: data.totalQuestions,
          time_spent: data.timeSpent,
          sessions_completed: data.sessionsCount
        });
      }

      return progressData.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return [];
    }
  }

  /**
   * Get comparative statistics
   */
  private static async getComparativeStatistics(userId: string): Promise<ComparativeStats | undefined> {
    try {
      // This would ideally be implemented as database functions/views
      // For now, we'll return undefined and implement later if needed
      const { data: userStats } = await supabase
        .from('user_statistics')
        .select('accuracy_percentage, avg_time_per_question')
        .eq('user_id', userId)
        .single();

      if (!userStats) return undefined;

      // Get average statistics from all users
      const { data: avgStats } = await supabase
        .from('user_statistics')
        .select('accuracy_percentage, avg_time_per_question')
        .not('accuracy_percentage', 'is', null);

      if (!avgStats || avgStats.length === 0) return undefined;

      const avgAccuracy = avgStats.reduce((sum, s) => sum + s.accuracy_percentage, 0) / avgStats.length;
      const avgTimePerQuestion = avgStats.reduce((sum, s) => sum + s.avg_time_per_question, 0) / avgStats.length;

      // Calculate percentile (simplified)
      const betterThanCount = avgStats.filter(s => s.accuracy_percentage < userStats.accuracy_percentage).length;
      const percentile = (betterThanCount / avgStats.length) * 100;

      return {
        user_accuracy: userStats.accuracy_percentage,
        average_accuracy: avgAccuracy,
        user_questions_per_session: 20, // Default assumption
        average_questions_per_session: 20,
        user_time_per_question: userStats.avg_time_per_question,
        average_time_per_question: avgTimePerQuestion,
        user_percentile: percentile,
        total_users: avgStats.length
      };
    } catch (error) {
      console.error('Error fetching comparative statistics:', error);
      return undefined;
    }
  }

  /**
   * Generate study recommendations based on statistics
   */
  private static generateRecommendations(
    overallStats: UserStatistics,
    sectionStats: SectionStatistics[]
  ): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    // Identify weak areas (accuracy < 70%)
    const weakSections = sectionStats.filter(s => s.accuracy_percentage < 70);
    weakSections.forEach(section => {
      recommendations.push({
        type: 'weakness',
        title: `Improve ${section.section_name}`,
        description: `Your accuracy in ${section.section_name} is ${section.accuracy_percentage.toFixed(1)}%. This area needs more practice.`,
        section_id: section.section_id,
        section_name: section.section_name,
        priority: 'high',
        action: 'Focus on practice questions in this section'
      });
    });

    // Identify strengths (accuracy >= 85%)
    const strongSections = sectionStats.filter(s => s.accuracy_percentage >= 85);
    if (strongSections.length > 0) {
      const bestSection = strongSections[0];
      recommendations.push({
        type: 'strength',
        title: `Strength: ${bestSection.section_name}`,
        description: `Excellent performance with ${bestSection.accuracy_percentage.toFixed(1)}% accuracy! You have a strong grasp of this topic.`,
        section_id: bestSection.section_id,
        section_name: bestSection.section_name,
        priority: 'low',
        action: 'Continue reviewing periodically to maintain proficiency'
      });
    }

    // Practice consistency
    if (overallStats.current_streak >= 3) {
      recommendations.push({
        type: 'consistency',
        title: 'Great Consistency!',
        description: `Your ${overallStats.current_streak}-day streak shows great consistency. Keep up the daily practice to maintain momentum!`,
        priority: 'medium',
        action: 'Continue your daily practice routine'
      });
    } else {
      recommendations.push({
        type: 'consistency',
        title: 'Build a Study Streak',
        description: 'Try to practice daily to build momentum and improve retention.',
        priority: 'medium',
        action: 'Aim for at least 10-15 questions per day'
      });
    }

    // Time management
    if (overallStats.avg_time_per_question > 90) { // 1.5 minutes
      recommendations.push({
        type: 'time-management',
        title: 'Improve Speed',
        description: `Your average of ${Math.round(overallStats.avg_time_per_question)}s per question could be improved. Practice timed quizzes.`,
        priority: 'medium',
        action: 'Try timed practice sessions to improve speed'
      });
    }

    // General practice if no specific weaknesses
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'practice',
        title: 'Continue Practicing',
        description: 'Keep up the good work! Regular practice will help maintain and improve your performance.',
        priority: 'low',
        action: 'Continue with mixed practice sessions'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Helper methods

  private static async calculateCurrentStreak(userId: string): Promise<{ current: number; best: number }> {
    try {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('started_at, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false });

      if (!data || data.length === 0) return { current: 0, best: 0 };

      // Get unique study dates
      const studyDates = [...new Set(data.map(s => s.started_at.split('T')[0]))].sort();
      
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 1;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Calculate current streak
      if (studyDates.includes(today) || studyDates.includes(yesterday)) {
        currentStreak = 1;
        let dateIndex = studyDates.length - 1;
        
        if (studyDates[dateIndex] === yesterday) {
          dateIndex--;
        }
        
        for (let i = dateIndex - 1; i >= 0; i--) {
          const currentDate = new Date(studyDates[i + 1]);
          const previousDate = new Date(studyDates[i]);
          const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));
          
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate best streak
      for (let i = 1; i < studyDates.length; i++) {
        const currentDate = new Date(studyDates[i]);
        const previousDate = new Date(studyDates[i - 1]);
        const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);

      return { current: currentStreak, best: bestStreak };
    } catch (error) {
      console.error('Error calculating streak:', error);
      return { current: 0, best: 0 };
    }
  }

  private static async calculateStudyDays(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (!data) return 0;

      const uniqueDays = new Set(data.map(s => s.started_at.split('T')[0]));
      return uniqueDays.size;
    } catch (error) {
      return 0;
    }
  }

  private static async getSessionCount(userId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('quiz_sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private static calculateImprovementTrend(attempts: any[]): 'improving' | 'stable' | 'declining' | 'insufficient-data' {
    if (attempts.length < 5) return 'insufficient-data';

    const midpoint = Math.floor(attempts.length / 2);
    const firstHalf = attempts.slice(0, midpoint);
    const secondHalf = attempts.slice(midpoint);

    const firstHalfAccuracy = firstHalf.reduce((sum, a) => sum + (a.is_correct ? 1 : 0), 0) / firstHalf.length;
    const secondHalfAccuracy = secondHalf.reduce((sum, a) => sum + (a.is_correct ? 1 : 0), 0) / secondHalf.length;

    const difference = secondHalfAccuracy - firstHalfAccuracy;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private static getDifficultyLevel(accuracy: number): 'needs-practice' | 'developing' | 'proficient' | 'mastery' {
    if (accuracy >= 90) return 'mastery';
    if (accuracy >= 80) return 'proficient';
    if (accuracy >= 70) return 'developing';
    return 'needs-practice';
  }

  private static getEmptyOverallStats(userId: string): UserStatistics {
    return {
      user_id: userId,
      total_questions: 0,
      total_correct: 0,
      accuracy_percentage: 0,
      avg_time_per_question: 0,
      total_time_spent: 0,
      sections_attempted: 0,
      last_quiz_date: null,
      total_sessions: 0,
      current_streak: 0,
      best_streak: 0,
      study_days: 0
    };
  }

  /**
   * Refresh materialized view (called after quiz completion)
   */
  static async refreshStatistics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_user_statistics');
      if (error) {
        console.error('Error refreshing statistics:', error);
      }
    } catch (error) {
      console.error('Error calling refresh function:', error);
    }
  }
}