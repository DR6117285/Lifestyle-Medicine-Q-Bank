import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, Clock, Trophy, BookOpen } from 'lucide-react';

export const Statistics = () => {
  // Mock data - will be replaced with real data from Supabase
  const overallStats = {
    totalQuestions: 156,
    correctAnswers: 122,
    accuracy: 78.2,
    averageTime: 45, // seconds
    totalSessions: 24,
    currentStreak: 5
  };

  const sectionStats = [
    { name: 'Introduction to Lifestyle Medicine', attempted: 15, correct: 13, accuracy: 86.7 },
    { name: 'Nutrition Science', attempted: 28, correct: 22, accuracy: 78.6 },
    { name: 'Physical Activity Science', attempted: 22, correct: 18, accuracy: 81.8 },
    { name: 'Behavior Change', attempted: 18, correct: 12, accuracy: 66.7 },
    { name: 'Mental Health Assessment', attempted: 16, correct: 14, accuracy: 87.5 },
    { name: 'Sleep Health Science', attempted: 12, correct: 9, accuracy: 75.0 },
    { name: 'Tobacco Cessation', attempted: 8, correct: 6, accuracy: 75.0 },
    { name: 'Positive Psychology', attempted: 10, correct: 8, accuracy: 80.0 },
  ];

  const recentSessions = [
    { date: '2025-08-06', type: 'Random Practice', questions: 20, score: 85, time: '12:30' },
    { date: '2025-08-05', type: 'Section: Nutrition', questions: 15, score: 80, time: '08:15' },
    { date: '2025-08-04', type: 'Timed Quiz', questions: 30, score: 73, time: '15:45' },
    { date: '2025-08-03', type: 'Random Practice', questions: 25, score: 76, time: '09:20' },
    { date: '2025-08-02', type: 'Section: Physical Activity', questions: 12, score: 92, time: '14:10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Statistics</h1>
        <p className="text-gray-600 mt-2">
          Track your progress and identify areas for improvement
        </p>
      </div>

      {/* Overall Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.correctAnswers} correct answers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageTime}s</div>
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
            <div className="text-2xl font-bold">{overallStats.totalSessions}</div>
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
            <div className="text-2xl font-bold">{overallStats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">↗ Improving</div>
            <p className="text-xs text-muted-foreground">
              based on recent sessions
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
          <div className="space-y-4">
            {sectionStats.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate pr-4">{section.name}</span>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{section.correct}/{section.attempted}</span>
                    <span className="font-medium">{section.accuracy}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      section.accuracy >= 80 ? 'bg-green-500' :
                      section.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${section.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{session.type}</p>
                      <p className="text-sm text-gray-500">{session.questions} questions</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className={`font-medium ${
                      session.score >= 80 ? 'text-green-600' :
                      session.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {session.score}%
                    </p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{session.date}</p>
                    <p className="text-xs text-gray-500">{session.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Areas where you can improve your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800">Focus Area: Behavior Change</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your accuracy in this section is 66.7%. Consider reviewing the fundamentals and practicing more questions in this area.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">Strength: Mental Health Assessment</h4>
              <p className="text-sm text-blue-700 mt-1">
                Excellent performance with 87.5% accuracy! You have a strong grasp of this topic.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Tip: Consistent Practice</h4>
              <p className="text-sm text-green-700 mt-1">
                Your 5-day streak shows great consistency. Keep up the daily practice to maintain momentum!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};