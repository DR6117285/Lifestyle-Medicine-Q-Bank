import React from 'react';
import { CheckCircle, XCircle, Clock, Target, Award, RotateCcw, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { QuizResult } from '@/types/quiz';
import { formatTime, formatDuration } from '@/lib/utils';

interface QuizResultsProps {
  result: QuizResult;
  onStartNew: () => void;
  onReturnHome: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  onStartNew,
  onReturnHome
}) => {
  // Calculate performance level
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (accuracy >= 80) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (accuracy >= 70) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const performance = getPerformanceLevel(result.accuracy);
  const averageTimePerQuestion = result.totalQuestions > 0 ? result.timeSpent / result.totalQuestions : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Results Card */}
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${performance.bgColor} mb-4`}>
            <Award className={`h-8 w-8 ${performance.color}`} />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <p className="text-gray-600">
            Here's how you performed on this quiz session.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {result.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-1">
                {result.totalQuestions - result.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${performance.color}`}>
                {result.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {formatTime(result.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
          </div>

          {/* Performance Badge */}
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${performance.bgColor} ${performance.color}`}>
            {performance.level}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Avg. {formatTime(Math.round(averageTimePerQuestion))} per question</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>{result.totalQuestions} questions attempted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {result.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Category</CardTitle>
            <p className="text-sm text-gray-600">
              See how you performed in different topic areas.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.categoryBreakdown.map((category, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.sectionName}</h4>
                      <p className="text-sm text-gray-600">{category.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {category.correct}/{category.total}
                      </div>
                      <div className={`text-sm font-medium ${
                        category.accuracy >= 70 ? 'text-green-600' : 
                        category.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {category.accuracy.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.accuracy >= 70 ? 'bg-green-500' : 
                        category.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${category.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Review</CardTitle>
          <p className="text-sm text-gray-600">
            Review your answers and see correct solutions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {result.attempts.map((attempt, index) => (
              <div key={attempt.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    {attempt.is_correct ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(attempt.time_taken)}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">Your answer:</span>
                    <span className={`font-medium ${
                      attempt.is_correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {attempt.selected_answer || 'No answer selected'}
                    </span>
                  </div>
                  {!attempt.is_correct && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <span className="text-gray-600">Correct answer:</span>
                      <span className="font-medium">
                        {/* We would need to fetch the correct answer from the question */}
                        View in detailed review
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onStartNew}
          className="flex items-center space-x-2"
          size="lg"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Start New Quiz</span>
        </Button>
        
        <Button
          onClick={onReturnHome}
          variant="outline"
          size="lg"
          className="flex items-center space-x-2"
        >
          <Home className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      {/* Motivational Message */}
      <div className="text-center py-6">
        <p className="text-gray-600">
          {result.accuracy >= 80 
            ? "Great job! Keep up the excellent work!" 
            : result.accuracy >= 60 
            ? "Good effort! Review the areas where you struggled and try again." 
            : "Don't give up! Learning takes practice. Review the material and try again."}
        </p>
      </div>
    </div>
  );
};