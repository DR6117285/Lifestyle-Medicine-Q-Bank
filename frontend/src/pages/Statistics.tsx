import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, Clock, Trophy, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { 
  useStatisticsData, 
  useStatisticsActions,
  useOverallStats,
  useSectionStats,
  useRecentSessions,
  useRecommendations
} from '../stores/statisticsStore';
import { StatisticsSkeleton } from '../components/statistics';

export const Statistics = () => {
  const { user } = useAuthStore();
  const { statistics, isLoading, isRefreshing, error, isDataFresh } = useStatisticsData();
  const { fetchStatistics, refreshStatistics, clearError } = useStatisticsActions();
  
  const overallStats = useOverallStats();
  const sectionStats = useSectionStats();
  const recentSessions = useRecentSessions();
  const recommendations = useRecommendations();

  // Fetch statistics on component mount
  useEffect(() => {
    if (user?.id) {
      fetchStatistics(user.id);
    }
  }, [user?.id, fetchStatistics]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (user?.id) {
      await refreshStatistics(user.id);
    }
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.round(remainingSeconds)}s`;
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Format session type
  const formatSessionType = (type: string, sectionName?: string | null): string => {
    if (type === 'section' && sectionName) {
      return `Section: ${sectionName}`;
    }
    return type === 'random' ? 'Random Practice' : 
           type === 'timed' ? 'Timed Quiz' : 
           type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Loading state
  if (isLoading && !statistics) {
    return <StatisticsSkeleton cards={6} />;
  }

  // Error state
  if (error && !statistics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Statistics</h1>
          <p className="text-gray-600 mt-2">
            Track your progress and identify areas for improvement
          </p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Unable to load statistics</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => {
                    clearError();
                    if (user?.id) fetchStatistics(user.id, true);
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!isLoading && (!overallStats || overallStats.total_questions === 0)) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Statistics</h1>
          <p className="text-gray-600 mt-2">
            Track your progress and identify areas for improvement
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz history yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Complete your first quiz to start tracking your progress and see detailed statistics.
              </p>
              <button 
                onClick={() => window.location.href = '/quiz'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Your First Quiz
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Statistics</h1>
          <p className="text-gray-600 mt-2">
            Track your progress and identify areas for improvement
          </p>
          {statistics?.lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {formatDate(statistics.lastUpdated)}
              {!isDataFresh && <span className="text-yellow-600"> (may be outdated)</span>}
            </p>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Overall Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_questions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.total_correct || 0} correct answers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.accuracy_percentage ? `${overallStats.accuracy_percentage.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.accuracy_percentage && overallStats.accuracy_percentage >= 80 
                ? 'Excellent performance!' 
                : overallStats?.accuracy_percentage && overallStats.accuracy_percentage >= 70 
                  ? 'Good progress!' 
                  : 'Keep practicing!'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.avg_time_per_question ? formatTime(overallStats.avg_time_per_question) : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              total completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
              {overallStats?.best_streak && overallStats.best_streak > (overallStats.current_streak || 0) && (
                <span> (best: {overallStats.best_streak})</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.total_time_spent ? formatTime(overallStats.total_time_spent) : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              across {overallStats?.study_days || 0} study days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Section</CardTitle>
          <CardDescription>
            Your accuracy across different lifestyle medicine topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sectionStats.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No section data available yet</p>
              <p className="text-sm text-gray-400">Complete more quizzes to see detailed section breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sectionStats.map((section) => (
                <div key={section.section_id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">{section.section_name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          section.difficulty_level === 'mastery' ? 'bg-green-100 text-green-700' :
                          section.difficulty_level === 'proficient' ? 'bg-blue-100 text-blue-700' :
                          section.difficulty_level === 'developing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {section.difficulty_level === 'needs-practice' ? 'Needs Practice' : 
                           section.difficulty_level.charAt(0).toUpperCase() + section.difficulty_level.slice(1)}
                        </span>
                        {section.improvement_trend !== 'insufficient-data' && (
                          <span className={`text-xs ${
                            section.improvement_trend === 'improving' ? 'text-green-600' :
                            section.improvement_trend === 'declining' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {section.improvement_trend === 'improving' ? '↗' :
                             section.improvement_trend === 'declining' ? '↘' : '→'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {section.category_name} • {formatTime(section.avg_time_per_question)} avg time
                        {section.last_attempted && (
                          <span> • Last: {formatDate(section.last_attempted)}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 ml-4">
                      <span>{section.correct_answers}/{section.questions_attempted}</span>
                      <span className="font-medium min-w-[3rem] text-right">
                        {section.accuracy_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        section.accuracy_percentage >= 90 ? 'bg-green-500' :
                        section.accuracy_percentage >= 80 ? 'bg-blue-500' :
                        section.accuracy_percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(section.accuracy_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your latest practice sessions and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent sessions</p>
              <p className="text-sm text-gray-400">Complete a quiz to see your session history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {formatSessionType(session.session_type, session.section_name)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.total_questions} questions • {formatTime(session.time_taken)} taken
                          {session.time_limit && (
                            <span> (limit: {session.time_limit}m)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${
                          session.performance_level === 'excellent' ? 'text-green-600' :
                          session.performance_level === 'good' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {session.accuracy.toFixed(1)}%
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.performance_level === 'excellent' ? 'bg-green-100 text-green-700' :
                          session.performance_level === 'good' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {session.performance_level === 'excellent' ? 'Excellent' :
                           session.performance_level === 'good' ? 'Good' : 'Needs Work'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.score}/{session.total_questions} correct
                      </p>
                    </div>
                    <div className="text-center min-w-[5rem]">
                      <p className="text-sm font-medium">{formatDate(session.completed_at)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.completed_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Personalized suggestions based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recommendations available yet</p>
              <p className="text-sm text-gray-400">Complete more quizzes to get personalized study suggestions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    recommendation.type === 'weakness' ? 'bg-red-50 border-red-200' :
                    recommendation.type === 'strength' ? 'bg-blue-50 border-blue-200' :
                    recommendation.type === 'consistency' ? 'bg-green-50 border-green-200' :
                    recommendation.type === 'time-management' ? 'bg-purple-50 border-purple-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className={`font-medium ${
                          recommendation.type === 'weakness' ? 'text-red-800' :
                          recommendation.type === 'strength' ? 'text-blue-800' :
                          recommendation.type === 'consistency' ? 'text-green-800' :
                          recommendation.type === 'time-management' ? 'text-purple-800' :
                          'text-yellow-800'
                        }`}>
                          {recommendation.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {recommendation.priority} priority
                        </span>
                      </div>
                      <p className={`text-sm mb-2 ${
                        recommendation.type === 'weakness' ? 'text-red-700' :
                        recommendation.type === 'strength' ? 'text-blue-700' :
                        recommendation.type === 'consistency' ? 'text-green-700' :
                        recommendation.type === 'time-management' ? 'text-purple-700' :
                        'text-yellow-700'
                      }`}>
                        {recommendation.description}
                      </p>
                      <p className={`text-xs font-medium ${
                        recommendation.type === 'weakness' ? 'text-red-600' :
                        recommendation.type === 'strength' ? 'text-blue-600' :
                        recommendation.type === 'consistency' ? 'text-green-600' :
                        recommendation.type === 'time-management' ? 'text-purple-600' :
                        'text-yellow-600'
                      }`}>
                        💡 Action: {recommendation.action}
                      </p>
                    </div>
                    {recommendation.section_id && (
                      <button
                        onClick={() => window.location.href = `/quiz?section=${recommendation.section_id}`}
                        className={`ml-4 px-3 py-1 text-xs rounded-md transition-colors ${
                          recommendation.type === 'weakness' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Practice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};