import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, BarChart3, Upload, Settings, Shield, Database, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPanel = () => {
  // Mock admin statistics - will be replaced with real data
  const adminStats = {
    totalUsers: 8,
    activeUsers: 6,
    totalQuestions: 450,
    totalSessions: 142,
    avgAccuracy: 76.5,
    questionsThisWeek: 23
  };

  const recentActivity = [
    { user: 'Dr. Smith', action: 'Completed nutrition quiz', time: '2 hours ago', score: '85%' },
    { user: 'Dr. Johnson', action: 'Started section practice', time: '4 hours ago', score: '-' },
    { user: 'Dr. Brown', action: 'Completed timed quiz', time: '6 hours ago', score: '78%' },
    { user: 'Dr. Davis', action: 'Registered new account', time: '1 day ago', score: '-' },
    { user: 'Dr. Wilson', action: 'Completed random practice', time: '1 day ago', score: '92%' }
  ];

  const systemHealth = [
    { metric: 'Database Health', status: 'Good', value: '99.9%', color: 'text-green-600' },
    { metric: 'Response Time', status: 'Excellent', value: '145ms', color: 'text-green-600' },
    { metric: 'Active Sessions', status: 'Normal', value: '3', color: 'text-blue-600' },
    { metric: 'Storage Used', status: 'Low', value: '2.3GB', color: 'text-yellow-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, questions, and monitor system performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-600">Administrator Access</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {adminStats.activeUsers} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Across 9 sections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {adminStats.questionsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Platform average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
            
            <Link to="/admin/questions">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Manage Questions</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
              <Upload className="h-6 w-6" />
              <span>Import Questions</span>
            </Button>
            
            <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
            <CardDescription>
              Latest actions from platform users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <div className="text-right">
                    {activity.score !== '-' && (
                      <p className="font-medium text-sm text-green-600">{activity.score}</p>
                    )}
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current status of platform components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{item.metric}</p>
                      <p className="text-sm text-gray-600">{item.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${item.color}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance Overview</CardTitle>
          <CardDescription>
            Summary of user engagement and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <p className="text-sm text-blue-800 mt-1">Users Active This Week</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">12.5</div>
              <p className="text-sm text-green-800 mt-1">Avg Questions Per Session</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">4.2</div>
              <p className="text-sm text-purple-800 mt-1">Sessions Per User Per Week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};