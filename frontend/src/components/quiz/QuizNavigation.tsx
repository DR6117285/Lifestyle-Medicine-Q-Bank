import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuizNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  correctAnswers: Set<number>;
  incorrectAnswers: Set<number>;
  onNavigateToQuestion: (index: number) => void;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  correctAnswers,
  incorrectAnswers,
  onNavigateToQuestion
}) => {
  const getQuestionIcon = (questionIndex: number) => {
    if (correctAnswers.has(questionIndex)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (incorrectAnswers.has(questionIndex)) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (answeredQuestions.has(questionIndex)) {
      return <Circle className="h-4 w-4 text-blue-500 fill-current" />;
    }
    return <Circle className="h-4 w-4 text-gray-300" />;
  };

  const getButtonStyle = (questionIndex: number) => {
    const isActive = questionIndex === currentIndex;
    const isAnswered = answeredQuestions.has(questionIndex);
    const isCorrect = correctAnswers.has(questionIndex);
    const isIncorrect = incorrectAnswers.has(questionIndex);

    let baseClasses = "w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center";
    
    if (isActive) {
      baseClasses += " ring-2 ring-blue-500 ring-offset-2";
    }

    if (isCorrect) {
      baseClasses += " bg-green-100 text-green-700 hover:bg-green-200";
    } else if (isIncorrect) {
      baseClasses += " bg-red-100 text-red-700 hover:bg-red-200";
    } else if (isAnswered) {
      baseClasses += " bg-blue-100 text-blue-700 hover:bg-blue-200";
    } else {
      baseClasses += " bg-gray-100 text-gray-600 hover:bg-gray-200";
    }

    return baseClasses;
  };

  // Group questions into rows of 10 for better display
  const questionRows = [];
  for (let i = 0; i < totalQuestions; i += 10) {
    const row = [];
    for (let j = i; j < Math.min(i + 10, totalQuestions); j++) {
      row.push(j);
    }
    questionRows.push(row);
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            Question Navigation
          </h3>
          <div className="text-xs text-gray-500">
            {answeredQuestions.size} of {totalQuestions} answered
          </div>
        </div>

        <div className="space-y-3">
          {questionRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-2 justify-center">
              {row.map((questionIndex) => (
                <button
                  key={questionIndex}
                  onClick={() => onNavigateToQuestion(questionIndex)}
                  className={getButtonStyle(questionIndex)}
                  title={`Question ${questionIndex + 1}${
                    answeredQuestions.has(questionIndex) 
                      ? ' - Answered' 
                      : ' - Not answered'
                  }`}
                >
                  <span className="absolute text-xs font-medium">
                    {questionIndex + 1}
                  </span>
                  <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
                    {getQuestionIcon(questionIndex)}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center space-x-6 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Circle className="h-4 w-4 text-gray-300" />
            <span className="text-xs text-gray-600">Not answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className="h-4 w-4 text-blue-500 fill-current" />
            <span className="text-xs text-gray-600">Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-600">Correct</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-gray-600">Incorrect</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};