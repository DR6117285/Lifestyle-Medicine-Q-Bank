import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart3, Clock, BookOpen, Trophy, Target, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ACLMButton } from '@/components/ui/ACLMButton';
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
      color: 'btn-primary'
    },
    {
      title: 'Random Questions',
      description: 'Quick random practice',
      icon: Target,
      href: '/quiz?mode=random',
      color: 'btn-secondary'
    },
    {
      title: 'Timed Exam',
      description: 'Simulate exam conditions',
      icon: Clock,
      href: '/exam',
      color: 'btn-outline'
    },
    {
      title: 'View Progress',
      description: 'Track your performance',
      icon: BarChart3,
      href: '/statistics',
      color: 'btn-outline'
    }
  ];

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="header">
        <h1>Welcome back, {user?.displayName || user?.email}!</h1>
        <p className="subtitle">Ready to continue your lifestyle medicine journey?</p>
      </div>

      {/* Quick Stats */}
      <div className="overall-stats">
        <div className="stat-box stat-animate">
          <h3>Questions Answered</h3>
          <div className="stat-value">
            {stats.questionsAnswered}
          </div>
          <div className="stat-detail">
            of {stats.totalQuestions} total
          </div>
        </div>

        <div className="stat-box stat-animate">
          <h3>Overall Accuracy</h3>
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-detail">+2.1% from last week</div>
        </div>

        <div className="stat-box stat-animate">
          <h3>Current Streak</h3>
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-detail">days in a row</div>
        </div>

        <div className="stat-box stat-animate">
          <h3>Last Session</h3>
          <div className="stat-value">{stats.lastSession}</div>
          <div className="stat-detail">Keep it up!</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
          Quick Actions
        </h2>
        <div className="action-buttons">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href} className={`btn ${action.color}`}>
                <Icon className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
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