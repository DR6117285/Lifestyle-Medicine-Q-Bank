import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Home, BarChart3, SkipForward, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { formatTime } from '@/lib/utils';
import { ProgressView } from './ProgressView';
import '@/styles/quiz-interface.css';

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
    getQuestionAnswer,
    isRetryMode
  } = useQuizStore();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
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
      
      // If question is already answered, we should show the rationale
      // This ensures that when navigating back to answered questions,
      // the user sees their previous answer and the feedback
      if (currentQuestion.isAnswered && existingAnswer) {
        // The showRationale state is managed by the quiz store
        // but we need to ensure it's properly set for already answered questions
        // Note: The showRationale state from useQuizStore should handle this
      }
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

  // Handle skip question
  const handleSkipQuestion = () => {
    if (canGoNext()) {
      nextQuestion();
    }
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    // Additional pause logic could be implemented here
  };

  // Handle view progress
  const handleViewProgress = () => {
    setShowProgress(true);
  };

  if (isLoading) {
    return (
      <div className="quiz-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="error-container">
          <h2 className="error-title">Oops! Something went wrong</h2>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            <button onClick={clearError} className="btn btn-outline">
              <AlertCircle className="w-4 h-4" />
              Try Again
            </button>
            <button onClick={onExit} className="btn btn-primary">
              <Home className="w-4 h-4" />
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="quiz-container">
        <div className="error-container">
          <h2 className="error-title">No Questions Available</h2>
          <p className="error-message">There are no questions available for this quiz session.</p>
          <div className="action-buttons">
            <button onClick={onExit} className="btn btn-primary">
              <Home className="w-4 h-4" />
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show progress view if requested
  if (showProgress) {
    return (
      <ProgressView 
        onReturn={() => setShowProgress(false)}
        onReturnHome={onExit}
        onRetryIncorrect={() => {
          setShowProgress(false);
          // Could implement retry logic here
        }}
      />
    );
  }

  const isAnswered = currentQuestion.isAnswered;
  const isCorrect = currentQuestion.isCorrect;

  return (
    <div className="quiz-container fade-in">
      {/* Home Button Container */}
      <div className="home-button-container">
        <button onClick={onExit} className="home-btn">
          <Home className="w-4 h-4" />
          Return to Home
        </button>
      </div>

      {/* Flow Breadcrumb for Retry Mode */}
      {isRetryMode && (
        <div className="flow-breadcrumb">
          <div className="breadcrumb-item completed">
            <CheckCircle className="w-4 h-4" />
            Quiz Complete
          </div>
          <span className="breadcrumb-arrow">→</span>
          <div className="breadcrumb-item completed">
            <RotateCcw className="w-4 h-4" />
            Review Questions
          </div>
          <span className="breadcrumb-arrow">→</span>
          <div className="breadcrumb-item active">
            <AlertCircle className="w-4 h-4" />
            Retry Session
          </div>
        </div>
      )}

      {/* Quiz Header */}
      <div className="quiz-header">
        <h1>
          {isRetryMode && (
            <span className="retry-mode-indicator">
              <RotateCcw className="w-5 h-5" />
              Focused Review
            </span>
          )}
          {isRetryMode ? (
            `Retry Question ${progress.current} of ${progress.total}`
          ) : (
            `Question ${progress.current} of ${progress.total}`
          )}
        </h1>
        <div className="quiz-meta">
          {timeRemaining !== undefined && (
            <div className={`timer-display ${timeRemaining < 300 ? 'warning' : ''}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
          <div className="question-progress">
            {isRetryMode ? (
              <div className="retry-progress-context" style={{ 
                padding: '8px 16px', 
                margin: 0, 
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🎯 Mastering: {Math.round((progress.current / progress.total) * 100)}%</span>
                  <span>📚 Focus Session</span>
                </div>
              </div>
            ) : (
              `Progress: ${Math.round((progress.current / progress.total) * 100)}%`
            )}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className={`question-card ${isRetryMode ? 'retry-mode' : ''}`} style={{
        ...(isRetryMode && {
          background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
          border: '2px solid #f59e0b',
          borderLeft: '6px solid #f59e0b'
        })
      }}>
        <div className="question-header">
          <h2 className="question-number" style={{
            ...(isRetryMode && { color: '#92400e' })
          }}>
            {isRetryMode ? 'Retry' : 'Question'} {progress.current}
          </h2>
          <div className="question-progress" style={{
            ...(isRetryMode && { 
              background: 'rgba(255, 255, 255, 0.8)', 
              border: '1px solid #f59e0b' 
            })
          }}>
            {progress.current} of {progress.total}
            {isRetryMode && <span style={{ marginLeft: '8px' }}>🔄</span>}
          </div>
        </div>
        
        {/* Retry Mode Context Banner */}
        {isRetryMode && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
            <div style={{ flex: 1 }}>
              <p style={{ 
                margin: 0, 
                color: '#92400e', 
                fontSize: '0.95rem',
                fontWeight: '600'
              }}>
                💡 Take your time to read carefully. You got this question wrong before - let's master it now!
              </p>
            </div>
          </div>
        )}
        
        <div className="question-text">
          {currentQuestion.question_text}
        </div>

        {/* Options Form */}
        <form onSubmit={(e) => { e.preventDefault(); showRationale ? handleNext() : handleSubmitAnswer(); }}>
          <div className="options-container">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption.startsWith(option.option_key);
              const isCorrectOption = showRationale && 
                currentQuestion.correct_answer.startsWith(option.option_key);
              const isWrongSelection = showRationale && isSelected && !isCorrectOption;
              
              let optionClass = 'option-item';
              if (isSelected && !showRationale) optionClass += ' selected';
              if (showRationale && isCorrectOption) optionClass += ' correct';
              if (showRationale && isWrongSelection) optionClass += ' incorrect';
              if (showRationale) optionClass += ' disabled';

              return (
                <div
                  key={option.option_key}
                  className={optionClass}
                  onClick={() => !showRationale && handleOptionSelect(option.option_key, option.option_text)}
                  role="button"
                  tabIndex={showRationale ? -1 : 0}
                  aria-pressed={isSelected}
                >
                  <div className="option-radio"></div>
                  <div className="option-text">
                    <span className="option-key">{option.option_key})</span>
                    {option.option_text}
                  </div>
                  <input 
                    type="radio" 
                    name="selected_option" 
                    id={`option-${option.option_key}`}
                    value={option.option_key}
                    checked={isSelected}
                    disabled={showRationale}
                    onChange={() => {}}
                    style={{ display: 'none' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {!showRationale && (
              <>
                <button 
                  type="submit" 
                  className={`btn ${isRetryMode ? 'btn-retry' : 'btn-primary'}`}
                  disabled={!selectedOption || isLoading}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isRetryMode ? 'Submit Retry Answer' : 'Submit Answer'}
                </button>
                {!isRetryMode && (
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={handleSkipQuestion}
                    disabled={!canGoNext()}
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip Question
                  </button>
                )}
              </>
            )}
            
            {timerActive && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handlePauseResume}
              >
                <Pause className="w-4 h-4" />
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Feedback Section */}
      {showRationale && (
        <div className="feedback-section" style={{
          ...(isRetryMode && {
            background: isCorrect 
              ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' 
              : 'linear-gradient(135deg, #fef2f2, #fecaca)',
            borderLeft: isCorrect 
              ? '6px solid #22c55e' 
              : '6px solid #ef4444'
          })
        }}>
          <div className={`feedback-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5" />
                {isRetryMode ? '🎉 Excellent! You mastered it!' : 'Correct!'}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                {isRetryMode ? '📚 Keep studying - you\'ll get it next time!' : 'Incorrect'}
              </>
            )}
          </div>
          <div className="feedback-content">
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
        </div>
      )}

      {/* Navigation Section */}
      <div className="navigation-section">
        <div className="nav-buttons">
          <button 
            className="nav-btn" 
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button 
            className={`nav-btn ${showRationale ? 'primary' : ''}`}
            onClick={handleNext}
            disabled={!showRationale}
          >
            {canGoNext() ? (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Complete Quiz
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="progress-section">
        <button 
          onClick={handleViewProgress} 
          className="nav-btn view-progress-btn"
        >
          <BarChart3 className="w-4 h-4" />
          View Progress
        </button>
        <p className="progress-text">
          {isRetryMode ? (
            <>
              🎯 Retry Session: {progress.current} of {progress.total} • 
              {questionTimeSpent ? ` Focus Time: ${Math.round(questionTimeSpent)}s • ` : ''}
              Mastery Progress: {Math.round(progress.accuracy) || 0}%
            </>
          ) : (
            <>
              Question {progress.current} of {progress.total} • 
              {questionTimeSpent ? ` Time: ${Math.round(questionTimeSpent)}s • ` : ''}
              Accuracy: {Math.round(progress.accuracy) || 0}%
            </>
          )}
        </p>
      </div>
    </div>
  );
};