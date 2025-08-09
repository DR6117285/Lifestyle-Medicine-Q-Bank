import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { formatTime } from '@/lib/utils';

interface QuizInterfaceProps {
  onComplete: () => void;
  onExit: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ onComplete, onExit }) => {
  const { user } = useAuthStore();
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

  // Initialize time tracking
  const { 
    timeSpent: questionTimeSpent,
    isTracking,
    startTracking,
    stopTracking,
    getAverageTime
  } = useTimeTracking({
    questionId: currentQuestion?.id,
    userId: user?.id,
    onTimeUpdate: (timeSpent) => {
      // Optional: Update UI with time spent
      if (timeSpent > 120) { // Warning after 2 minutes
        console.log(`Question taking longer than expected: ${timeSpent}s`);
      }
    }
  });

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
  const handleNext = async () => {
    // Save time for current question before moving
    if (currentQuestion) {
      await stopTracking();
    }

    if (canGoNext()) {
      nextQuestion();
    } else {
      // Last question - complete quiz
      handleCompleteQuiz();
    }
  };

  // Handle previous question
  const handlePrevious = async () => {
    // Save time for current question before moving
    if (currentQuestion) {
      await stopTracking();
    }
    previousQuestion();
  };

  // Handle quiz completion
  const handleCompleteQuiz = async () => {
    try {
      // Ensure final time is saved
      if (currentQuestion) {
        await stopTracking();
      }
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
      <div className="container">
        <div className="feedback">
          <div className="feedback-result incorrect">
            Error
          </div>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={clearError} className="btn btn-outline">
              Try Again
            </button>
            <button onClick={onExit} className="btn btn-primary">
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container">
        <div className="header">
          <h1>No Questions Available</h1>
          <p className="subtitle">There are no questions available for this quiz.</p>
        </div>
        <div className="start-container">
          <button onClick={onExit} className="start-btn">
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = currentQuestion.isAnswered;
  const isCorrect = currentQuestion.isCorrect;

  return (
    <div className="container">
      {/* Home Button Container */}
      <div className="home-button-container">
        <a href="#" onClick={(e) => { e.preventDefault(); onExit(); }} className="home-btn">
          Return to Home
        </a>
      </div>

      {/* Question Header */}
      <div className="question-header">
        <h1>Question {progress.current}</h1>
        {timeRemaining !== undefined && (
          <div className="text-sm text-gray-600 ml-4">
            Time Remaining: {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* Question Text */}
      <div className="question">
        {currentQuestion.question_text}
      </div>

      {/* Question Form */}
      <form onSubmit={(e) => { e.preventDefault(); showRationale ? handleNext() : handleSubmitAnswer(); }}>
        <div className="options">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption.startsWith(option.option_key);
            const isCorrectOption = showRationale && 
              currentQuestion.correct_answer.startsWith(option.option_key);
            const isWrongSelection = showRationale && isSelected && !isCorrectOption;
            
            let optionClass = 'option';
            if (isSelected && !showRationale) optionClass += ' selected';
            if (showRationale && isCorrectOption) optionClass += ' correct';
            if (showRationale && isWrongSelection) optionClass += ' incorrect';

            return (
              <div
                key={option.option_key}
                className={optionClass}
                onClick={() => !showRationale && handleOptionSelect(option.option_key, option.option_text)}
              >
                <input 
                  type="radio" 
                  name="selected_option" 
                  id={`option-${option.option_key}`}
                  value={option.option_key}
                  checked={isSelected}
                  disabled={showRationale}
                  onChange={() => {}}
                />
                <label htmlFor={`option-${option.option_key}`}>
                  {option.option_text}
                </label>
              </div>
            );
          })}
        </div>

        {/* Submit Button (only when answer not submitted) */}
        {!showRationale && !isAnswered && (
          <div className="submit-container">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={!selectedOption || isLoading}
            >
              Submit Answer
            </button>
          </div>
        )}
      </form>

      {/* Feedback Section */}
      {showRationale && (
        <div className="feedback">
          <div className={`feedback-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          <p><strong>Correct Answer:</strong> {currentQuestion.correct_answer}</p>
          {currentQuestion.rationale && (
            <p><strong>Rationale:</strong> {currentQuestion.rationale}</p>
          )}
          {currentQuestion.section && (
            <p><strong>Section:</strong> {currentQuestion.section}</p>
          )}
          {currentQuestion.question_type && (
            <p><strong>Question Type:</strong> {currentQuestion.question_type}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="navigation">
        <button 
          className="nav-btn" 
          onClick={handlePrevious}
          disabled={!canGoPrevious()}
        >
          Previous
        </button>
        
        <button 
          className="nav-btn" 
          onClick={handleNext}
          disabled={!showRationale && !isAnswered}
        >
          {canGoNext() ? 'Next' : 'Complete'}
        </button>
      </div>

      {/* Progress Counter */}
      <div className="progress-counter">
        <a href="#" onClick={(e) => { e.preventDefault(); /* Navigate to progress */ }} className="nav-btn view-progress-btn">
          View Progress
        </a>
        <p>Question {progress.current} of {progress.total}</p>
      </div>
    </div>
  );
};