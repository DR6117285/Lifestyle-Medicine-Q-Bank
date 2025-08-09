import { Link } from 'react-router-dom';
import { Play, BarChart3, Clock, BookOpen, Trophy, Target, TrendingUp, Award, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';

export const Dashboard = () => {
  const { user } = useAuthStore();

  // Mock stats - will be replaced with real data later
  const stats = {
    totalQuestions: 450,
    questionsAnswered: 156,
    accuracy: 78,
    streak: 5,
    lastSession: '2 days ago',
    favoriteSection: 'Nutrition Science'
  };

  const quickActions = [
    {
      title: 'Practice Quiz',
      description: 'Start a custom practice session',
      icon: Play,
      href: '/landing',
      variant: 'default' as const,
      gradient: true
    },
    {
      title: 'Random Questions',
      description: 'Quick random practice',
      icon: Target,
      href: '/quiz?mode=random',
      variant: 'secondary' as const
    },
    {
      title: 'Timed Exam',
      description: 'Simulate exam conditions',
      icon: Clock,
      href: '/exam',
      variant: 'outline' as const
    },
    {
      title: 'View Progress',
      description: 'Track your performance',
      icon: BarChart3,
      href: '/statistics',
      variant: 'ghost' as const
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4 py-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gradient tracking-tight">
            Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to continue your lifestyle medicine journey? Track your progress and enhance your knowledge.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Badge variant="medical" className="px-3 py-1">
            <Award className="w-3 h-3 mr-1" />
            {stats.streak} day streak
          </Badge>
          <Badge variant="success">
            <TrendingUp className="w-3 h-3 mr-1" />
            {stats.accuracy}% accuracy
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="elevated" className="stats-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="stats-label">Questions Answered</p>
                <p className="stats-value">{stats.questionsAnswered}</p>
                <p className="text-xs text-muted-foreground">
                  of {stats.totalQuestions} total
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={stats.questionsAnswered} 
                max={stats.totalQuestions} 
                variant="medical" 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="stats-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="stats-label">Overall Accuracy</p>
                <p className="stats-value">{stats.accuracy}%</p>
                <p className="stats-change positive text-xs">
                  +2.1% from last week
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <Trophy className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={stats.accuracy} 
                max={100} 
                variant="success" 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="stats-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="stats-label">Current Streak</p>
                <p className="stats-value">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">days in a row</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <Zap className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="stats-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="stats-label">Last Session</p>
                <p className="stats-value text-xl">{stats.lastSession}</p>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Quick Actions</h2>
          <p className="text-muted-foreground">Choose your preferred study method</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href} className="group">
                <Card variant="interactive" className="h-full hover-lift">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-colors ${
                      action.gradient 
                        ? 'bg-gradient-to-r from-primary to-accent' 
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}>
                      <Icon className={`w-6 h-6 ${action.gradient ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest quiz sessions and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Nutrition Science', type: 'Section Practice', score: 85, date: '2 days ago', questions: 25 },
              { name: 'Random Practice', type: 'Mixed Questions', score: 72, date: '3 days ago', questions: 15 },
              { name: 'Timed Quiz', type: '30 minutes', score: 68, date: '1 week ago', questions: 20 }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.type} • {activity.questions} questions</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge 
                    variant={activity.score >= 80 ? 'success' : activity.score >= 70 ? 'warning' : 'destructive'}
                    className="font-medium"
                  >
                    {activity.score}%
                  </Badge>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
            
            <Link 
              to="/statistics" 
              className="block text-center py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All Activity →
            </Link>
          </CardContent>
        </Card>

        <Card variant="elevated" className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Progress Overview</span>
            </CardTitle>
            <CardDescription>
              Your learning progress across medical specialties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: 'Nutrition Science', progress: 85, variant: 'success' as const, questions: 127 },
              { name: 'Physical Activity', progress: 72, variant: 'medical' as const, questions: 98 },
              { name: 'Behavior Change', progress: 68, variant: 'warning' as const, questions: 84 },
              { name: 'Mental Health', progress: 45, variant: 'default' as const, questions: 52 }
            ].map((section) => (
              <div key={section.name} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{section.name}</p>
                    <p className="text-xs text-muted-foreground">{section.questions} questions completed</p>
                  </div>
                  <Badge variant={section.variant} className="font-medium">
                    {section.progress}%
                  </Badge>
                </div>
                <Progress 
                  value={section.progress} 
                  max={100} 
                  variant={section.variant}
                  className="h-3"
                  animated
                />
              </div>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold text-foreground">67.5%</span>
              </div>
              <Progress 
                value={67.5} 
                max={100} 
                variant="medical"
                className="h-2 mt-2"
                animated
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};