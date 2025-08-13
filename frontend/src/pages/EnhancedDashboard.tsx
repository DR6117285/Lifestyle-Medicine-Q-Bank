import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  BarChart3, 
  Clock, 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  Calendar, 
  Zap,
  Brain,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
  Filter,
  Search,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useQuizStore } from '@/stores/quizStore';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { LoadingSpinner, DashboardSkeleton } from '@/components/ui/LoadingSpinner';
import { useToastHelpers } from '@/components/ui/Toast';
import { 
  MemoizedStatisticsCard, 
  MemoizedProgressRing, 
  MemoizedQuickAction 
} from '@/components/optimization/MemoizedComponents';
import { useDebounce, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';

interface RecentActivity {
  id: string;
  type: 'quiz' | 'achievement' | 'streak';
  title: string;
  description: string;
  timestamp: Date;
  score?: number;
  category?: string;
}

interface StudyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline?: Date;
  category: string;
}

export const EnhancedDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { resetQuiz } = useQuizStore();
  const { 
    userStats, 
    recentSessions, 
    isLoading: statsLoading, 
    fetchStatistics 
  } = useStatisticsStore();
  
  const { success, info } = useToastHelpers();
  const { measure } = usePerformanceMonitor('Dashboard');
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [showGoals, setShowGoals] = useState(true);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mock data - replace with real API calls
  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'quiz',
      title: 'Nutrition Science Quiz',
      description: 'Completed with 85% accuracy',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      score: 85,
      category: 'Nutrition'
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Study Streak Milestone',
      description: '7-day study streak achieved!',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      category: 'Achievement'
    },
    {
      id: '3',
      type: 'quiz',
      title: 'Physical Activity Assessment',
      description: 'Completed with 92% accuracy',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      score: 92,
      category: 'Exercise'
    }
  ]);

  const [studyGoals] = useState<StudyGoal[]>([
    {
      id: '1',
      title: 'Weekly Quiz Completion',
      target: 5,
      current: 3,
      unit: 'quizzes',
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      category: 'Practice'
    },
    {
      id: '2',
      title: 'Nutrition Mastery',
      target: 100,
      current: 76,
      unit: 'questions',
      category: 'Nutrition'
    },
    {
      id: '3',
      title: 'Board Exam Prep',
      target: 50,
      current: 23,
      unit: 'hours',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      category: 'Exam Prep'
    }
  ]);

  // Enhanced statistics with real data integration
  const enhancedStats = useMemo(() => {
    const baseStats = {
      totalQuestions: userStats?.totalQuestions || 450,
      questionsAnswered: userStats?.questionsAnswered || 156,
      accuracy: userStats?.overallAccuracy || 78,
      streak: userStats?.currentStreak || 5,
      lastSession: userStats?.lastSessionDate ? 
        new Date(userStats.lastSessionDate).toLocaleDateString() : 
        '2 days ago',
      favoriteSection: userStats?.bestCategory || 'Nutrition Science',
      weeklyGoal: 80, // Hours studied this week
      weeklyProgress: userStats?.weeklyProgress || 65,
      rank: userStats?.rank || 'Advanced',
      certificationsEarned: userStats?.certificationsEarned || 2
    };

    return {
      ...baseStats,
      completionRate: Math.round((baseStats.questionsAnswered / baseStats.totalQuestions) * 100),
      averageSessionScore: userStats?.averageScore || 82,
      totalStudyTime: userStats?.totalStudyTime || 47, // hours
      strongestAreas: userStats?.strongestAreas || ['Nutrition', 'Exercise Physiology'],
      improvementAreas: userStats?.weakestAreas || ['Mental Health', 'Community Health']
    };
  }, [userStats]);

  const quickActions = useMemo(() => [
    {
      title: 'Practice Quiz',
      description: 'Start a custom practice session',
      icon: Play,
      href: '/landing',
      variant: 'primary' as const,
      action: () => {
        resetQuiz();
        success('Starting new practice session');
        window.location.href = '/landing';
      }
    },
    {
      title: 'Random Quiz',
      description: 'Quick 20-question random quiz',
      icon: Zap,
      href: '/quiz?mode=random',
      variant: 'secondary' as const,
      action: () => {
        resetQuiz();
        success('Starting random quiz session');
        window.location.href = '/quiz?mode=random';
      }
    },
    {
      title: 'Timed Exam',
      description: 'Simulate real exam conditions',
      icon: Clock,
      href: '/exam',
      variant: 'default' as const
    },
    {
      title: 'Weak Areas',
      description: 'Focus on improvement areas',
      icon: Target,
      href: `/quiz?categories=${enhancedStats.improvementAreas.join(',')}`,
      variant: 'default' as const
    },
    {
      title: 'Progress Review',
      description: 'Detailed performance analytics',
      icon: BarChart3,
      href: '/statistics',
      variant: 'default' as const
    },
    {
      title: 'Study Goals',
      description: 'Track your learning objectives',
      icon: Trophy,
      action: () => setShowGoals(!showGoals),
      variant: 'default' as const
    }
  ], [enhancedStats.improvementAreas, resetQuiz, success, showGoals]);

  const filteredActivity = useMemo(() => {
    let filtered = recentActivity;
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        activity.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    if (selectedFilter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(activity => activity.timestamp > weekAgo);
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [recentActivity, debouncedSearchTerm, selectedFilter]);

  // Load statistics on component mount
  useEffect(() => {
    if (user?.id && !statsLoading) {
      measure(() => fetchStatistics(user.id));
    }
  }, [user?.id, fetchStatistics, statsLoading, measure]);

  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8" role="main" aria-label="Dashboard Overview">
      {/* Welcome Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" role="banner">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.displayName || 'Student'}!
          </h1>
          <p className="text-slate-800 mt-1 font-semibold">
            Continue your lifestyle medicine journey
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            {enhancedStats.rank} Level
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            {enhancedStats.streak} Day Streak
          </Badge>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Key Performance Metrics">
        <MemoizedStatisticsCard
          title="Questions Answered"
          value={enhancedStats.questionsAnswered}
          change={12}
          icon={BookOpen}
          variant="default"
        />
        <MemoizedStatisticsCard
          title="Average Accuracy"
          value={`${enhancedStats.accuracy}%`}
          change={5}
          icon={Target}
          variant="success"
        />
        <MemoizedStatisticsCard
          title="Study Time (Hours)"
          value={enhancedStats.totalStudyTime}
          change={8}
          icon={Clock}
          variant="default"
        />
        <MemoizedStatisticsCard
          title="Certifications"
          value={enhancedStats.certificationsEarned}
          change={0}
          icon={Award}
          variant="default"
        />
      </section>

      {/* Progress Overview */}
      <section className="grid gap-6 lg:grid-cols-3" aria-label="Learning Progress Overview">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              Learning Progress
            </CardTitle>
            <CardDescription className="text-slate-800 font-semibold">
              Your overall progress across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{enhancedStats.completionRate}%</span>
                </div>
                <Progress value={enhancedStats.completionRate} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Strongest Areas
                  </h4>
                  <div className="space-y-1">
                    {enhancedStats.strongestAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Focus Areas
                  </h4>
                  <div className="space-y-1">
                    {enhancedStats.improvementAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="border-slate-300 text-slate-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Weekly Goal
            </CardTitle>
            <CardDescription className="text-slate-800 font-semibold">Study time this week</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <MemoizedProgressRing 
              progress={enhancedStats.weeklyProgress}
              size={120}
              showPercentage={true}
            />
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-slate-800">
                {enhancedStats.weeklyProgress}%
              </p>
              <p className="text-sm text-slate-800 font-semibold">
                {Math.round(enhancedStats.weeklyGoal * (enhancedStats.weeklyProgress / 100))} / {enhancedStats.weeklyGoal} hours
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-slate-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into your learning activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <MemoizedQuickAction
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                variant={action.variant}
                onClick={() => {
                  if (action.action) {
                    action.action();
                  } else if (action.href) {
                    window.location.href = action.href;
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Goals */}
      {showGoals && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-slate-600" />
                  Study Goals
                </CardTitle>
                <CardDescription>
                  Track your learning objectives and milestones
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGoals(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyGoals.map((goal) => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{goal.title}</h4>
                    <Badge variant="outline">{goal.category}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Due: {goal.deadline.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest learning sessions and achievements
              </CardDescription>
            </div>
            
            {/* Search and Filter */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <div className="flex items-center gap-1">
                {['all', 'recent', 'favorites'].map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter as typeof selectedFilter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-slate-700 font-medium">No activity found matching your criteria</p>
              </div>
            ) : (
              filteredActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activity.type === 'quiz' && "bg-slate-100 text-slate-600",
                    activity.type === 'achievement' && "bg-success-100 text-success-600",
                    activity.type === 'streak' && "bg-warning-100 text-warning-600"
                  )}>
                    {activity.type === 'quiz' && <BookOpen className="h-4 w-4" />}
                    {activity.type === 'achievement' && <Trophy className="h-4 w-4" />}
                    {activity.type === 'streak' && <Star className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{activity.title}</h4>
                      <span className="text-xs text-slate-700 font-medium whitespace-nowrap ml-2">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {activity.category && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.category}
                        </Badge>
                      )}
                      {activity.score && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            activity.score >= 90 ? "border-green-400 text-green-800" :
                            activity.score >= 80 ? "border-blue-400 text-blue-800" :
                            activity.score >= 70 ? "border-slate-300 text-slate-700" :
                            "border-red-400 text-red-800"
                          )}
                        >
                          {activity.score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};