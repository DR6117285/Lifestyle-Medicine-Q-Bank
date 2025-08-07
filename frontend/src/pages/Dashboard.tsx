import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart3, Clock, BookOpen, Trophy, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      title: 'Random Practice',
      description: 'Practice questions from all sections',
      icon: Play,
      href: '/quiz?mode=random',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Timed Quiz',
      description: 'Simulate exam conditions',
      icon: Clock,
      href: '/quiz?mode=timed',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Study Sections',
      description: 'Focus on specific topics',
      icon: BookOpen,
      href: '/sections',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Statistics',
      description: 'Track your progress',
      icon: BarChart3,
      href: '/statistics',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName || user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Ready to continue your lifestyle medicine journey?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Questions Answered
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionsAnswered}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalQuestions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Accuracy
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Session
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastSession}</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest quiz sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Nutrition Science</p>
                  <p className="text-sm text-gray-500">Section Practice</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">85%</p>
                  <p className="text-sm text-gray-500">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Random Practice</p>
                  <p className="text-sm text-gray-500">Mixed Questions</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">72%</p>
                  <p className="text-sm text-gray-500">3 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Timed Quiz</p>
                  <p className="text-sm text-gray-500">30 minutes</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-yellow-600">68%</p>
                  <p className="text-sm text-gray-500">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>
              Your learning progress by section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Nutrition Science', progress: 85, color: 'bg-green-500' },
                { name: 'Physical Activity', progress: 72, color: 'bg-blue-500' },
                { name: 'Behavior Change', progress: 68, color: 'bg-yellow-500' },
                { name: 'Mental Health', progress: 45, color: 'bg-red-500' }
              ].map((section) => (
                <div key={section.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{section.name}</span>
                    <span>{section.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${section.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${section.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};