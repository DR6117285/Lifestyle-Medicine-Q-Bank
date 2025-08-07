import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/stores/quizStore';
import { formatTime } from '@/lib/utils';

interface QuizInterfaceProps {
  onComplete: () => void;
  onExit: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ onComplete, onExit }) => {
  const {
    getCurrentQuestion,
    getProgress,
    canGoNext,
    canGoPrevious,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    timeRemaining,
    timerActive,
    showRationale,
    isLoading,
    error,
    clearError,
    getQuestionAnswer
  } = useQuizStore();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Update selected option when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = getQuestionAnswer(currentQuestion.id);
      setSelectedOption(existingAnswer || '');
    }
  }, [currentQuestion, getQuestionAnswer]);

  // Handle answer selection
  const handleOptionSelect = (optionKey: string, optionText: string) => {
    const fullAnswer = `${optionKey}) ${optionText}`;
    setSelectedOption(fullAnswer);
    selectAnswer(currentQuestion!.id, fullAnswer);
  };

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!selectedOption) {
      alert('Please select an answer before submitting.');
      return;
    }

    try {
      await submitAnswer();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Handle next question
  const handleNext = () => {
    if (canGoNext()) {
      nextQuestion();
    } else {
      // Last question - complete quiz
      handleCompleteQuiz();
    }
  };

  // Handle quiz completion
  const handleCompleteQuiz = async () => {
    try {
      await completeQuiz();
      onComplete();
    } catch (error) {
      console.error('Failed to complete quiz:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Error</h3>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button onClick={clearError} variant="outline">
                Try Again
              </Button>
              <Button onClick={onExit}>
                Exit Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">No questions available.</p>
            <Button onClick={onExit} className="mt-4">
              Back to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAnswered = currentQuestion.isAnswered;
  const isCorrect = currentQuestion.isCorrect;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Quiz</span>
          </Button>
          
          <div className="text-sm text-gray-600">
            Question {progress.current} of {progress.total}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timer (for timed mode) */}
          {timeRemaining !== undefined && (
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption.startsWith(option.option_key);
              const isCorrectOption = showRationale && 
                currentQuestion.correct_answer.startsWith(option.option_key);
              const isWrongSelection = showRationale && isSelected && !isCorrectOption;

              return (
                <div
                  key={option.option_key}
                  onClick={() => !showRationale && handleOptionSelect(option.option_key, option.option_text)}
                  className={`
                    p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${!showRationale && isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${showRationale && isCorrectOption ? 'border-green-500 bg-green-50' : ''}
                    ${showRationale && isWrongSelection ? 'border-red-500 bg-red-50' : ''}
                    ${!showRationale ? 'hover:border-gray-300 hover:bg-gray-50' : ''}
                    ${showRationale ? 'cursor-default' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${!showRationale && isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
                      ${showRationale && isCorrectOption ? 'bg-green-500 text-white' : ''}
                      ${showRationale && isWrongSelection ? 'bg-red-500 text-white' : ''}
                    `}>
                      {option.option_key}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{option.option_text}</p>
                    </div>
                    {showRationale && isCorrectOption && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    {showRationale && isWrongSelection && (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rationale */}
          {showRationale && currentQuestion.rationale && (
            <div className={`p-4 rounded-lg border-l-4 ${
              isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {currentQuestion.rationale}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={!canGoPrevious()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-3">
              {!showRationale ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || isLoading}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit Answer</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>{canGoNext() ? 'Next Question' : 'Complete Quiz'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};