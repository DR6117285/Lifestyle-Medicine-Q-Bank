import React, { useEffect, useState, useCallback } from 'react';
import { Clock, SkipForward, Eye, CheckCircle, ArrowLeft, ArrowRight, AlertCircle, BookOpen, Home, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTime } from '@/lib/utils';
import type { QuizSettings } from '@/types/quiz';

interface ExamInterfaceProps {
  onComplete: () => void;
  onExit: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({ onComplete, onExit }) => {
  const { user } = useAuthStore();
  const {
    initializeQuiz,
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
    questions,
    currentSession
  } = useQuizStore();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Initialize exam on component mount
  useEffect(() => {
    const initializeExam = async () => {
      if (!user || isInitialized || currentSession) return;
      
      try {
        const examSettings: QuizSettings = {
          mode: 'timed',
          questionCount: 50,
          timeLimit: 75 // 75 minutes for full exam
        };
        
        console.log('🔥 Initializing exam with settings:', examSettings);
        await initializeQuiz(user.id, examSettings);
        setIsInitialized(true);
      } catch (error) {
        console.error('🔥 Failed to initialize exam:', error);
      }
    };

    initializeExam();
  }, [user, initializeQuiz, isInitialized, currentSession]);

  // Update selected option when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = getQuestionAnswer(currentQuestion.id);
      setSelectedOption(existingAnswer || '');
    }
  }, [currentQuestion, getQuestionAnswer]);

  // Handle time up - auto-submit exam
  useEffect(() => {
    if (timeRemaining === 0 && timerActive) {
      handleTimeUp();
    }
  }, [timeRemaining, timerActive]);

  const handleTimeUp = useCallback(async () => {
    try {
      await completeQuiz();
      alert('Time is up! The exam has been submitted automatically.');
      onComplete();
    } catch (error) {
      console.error('Failed to auto-submit exam:', error);
    }
  }, [completeQuiz, onComplete]);

  const handleOptionSelect = (optionKey: string, optionText: string) => {
    const fullAnswer = `${optionKey}) ${optionText}`;
    setSelectedOption(fullAnswer);
    if (currentQuestion) {
      selectAnswer(currentQuestion.id, fullAnswer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion) {
      alert('Please select an answer before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitAnswer();
      
      // Automatically move to next question after a brief delay
      setTimeout(() => {
        if (canGoNext()) {
          nextQuestion();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestion) {
      setSkippedQuestions(prev => new Set(prev).add(currentQuestion.id));
      if (canGoNext()) {
        nextQuestion();
      }
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      nextQuestion();
    } else {
      handleCompleteExam();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious()) {
      previousQuestion();
    }
  };

  const handleCompleteExam = async () => {
    const unanswered = questions.filter(q => !getQuestionAnswer(q.id)).length;
    const skipped = skippedQuestions.size;
    
    if (unanswered > 0 || skipped > 0) {
      const message = [];
      if (unanswered > 0) message.push(`${unanswered} unanswered questions`);
      if (skipped > 0) message.push(`${skipped} skipped questions`);
      
      if (!confirm(`You have ${message.join(' and ')}. Are you sure you want to submit the exam?`)) {
        return;
      }
    }
    
    try {
      await completeQuiz();
      onComplete();
    } catch (error) {
      console.error('Failed to complete exam:', error);
      alert('Failed to complete exam. Please try again.');
    }
  };

  const getTimeRemainingColor = () => {
    if (!timeRemaining) return 'text-slate-600';
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 900) return 'text-yellow-600'; // Less than 15 minutes
    return 'text-green-600';
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Preparing Your Exam</h2>
            <p className="text-muted-foreground">
              Setting up your comprehensive lifestyle medicine exam...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-900">Exam Setup Failed</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={clearError} variant="outline">
                Try Again
              </Button>
              <Button onClick={onExit} variant="default">
                <Home className="h-4 w-4 mr-2" />
                Exit to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-4">
              There are no exam questions available at this time.
            </p>
            <Button onClick={onExit}>
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" role="application" aria-label="LMQB Exam Interface">
      {/* Live Regions for Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="status-announcements">
        {showRationale && currentQuestion.isCorrect !== undefined && (
          currentQuestion.isCorrect ? 
            `Correct! Moving to next question.` : 
            `Incorrect. The correct answer is ${currentQuestion.correct_answer}.`
        )}
      </div>
      
      <div aria-live="assertive" aria-atomic="true" className="sr-only" id="urgent-announcements">
        {timeRemaining !== undefined && timeRemaining < 300 && (
          `Warning: Only ${Math.floor(timeRemaining / 60)} minutes remaining.`
        )}
      </div>
      
      {/* Skip Navigation for Keyboard Users */}
      <a href="#main-question" className="skip-nav">
        Skip to main question
      </a>
      
      {/* Exam Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onExit}>
                <Home className="h-4 w-4 mr-2" />
                Exit Exam
              </Button>
              <Badge variant="outline" className="text-sm">
                Official LMQB Exam
              </Badge>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-sm text-muted-foreground" aria-live="polite">
                Question {progress.current} of {progress.total}
              </div>
              
              {timeRemaining !== undefined && (
                <div 
                  className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimeRemainingColor()}`}
                  role="timer"
                  aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
                >
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  <span aria-live="off">{formatTime(timeRemaining)}</span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Skipped: {skippedQuestions.size}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <Progress 
              value={progress.percentage} 
              className="h-2"
              aria-label={`Exam progress: ${Math.round(progress.percentage)}% complete`}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl" id="main-content">
        {/* Question Card */}
        <Card className="mb-6" id="main-question" role="group" aria-labelledby="question-title">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl leading-relaxed" id="question-title">
                <span className="sr-only">Question {progress.current} of {progress.total}: </span>
                {currentQuestion.question_text}
              </CardTitle>
              {skippedQuestions.has(currentQuestion.id) && (
                <Badge variant="secondary" className="ml-4 shrink-0">
                  Previously Skipped
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Options Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); showRationale ? handleNext() : handleSubmitAnswer(); }}
              role="group"
              aria-labelledby="question-title"
              aria-describedby="question-instructions"
            >
              <div id="question-instructions" className="sr-only">
                Select one answer from the options below. Use arrow keys to navigate and Enter to select.
              </div>
              <fieldset className="space-y-3 mb-6">
                <legend className="sr-only">Answer options for question {progress.current}</legend>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption.startsWith(option.option_key);
                  const isCorrectOption = showRationale && 
                    currentQuestion.correct_answer.startsWith(option.option_key);
                  const isWrongSelection = showRationale && isSelected && !isCorrectOption;
                  
                  return (
                    <label
                      key={option.option_key}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 block ${
                        isSelected && !showRationale ? 'border-primary bg-primary/5' :
                        showRationale && isCorrectOption ? 'border-green-500 bg-green-50' :
                        showRationale && isWrongSelection ? 'border-red-500 bg-red-50' :
                        'border-border hover:border-primary/50 hover:bg-muted/50'
                      } ${showRationale ? 'cursor-default' : ''}`}
                      htmlFor={`option-${option.option_key}`}
                    >
                      <input
                        type="radio"
                        id={`option-${option.option_key}`}
                        name="exam-question"
                        value={option.option_key}
                        checked={isSelected}
                        onChange={() => !showRationale && handleOptionSelect(option.option_key, option.option_text)}
                        disabled={showRationale}
                        className="sr-only"
                        aria-describedby={`option-${option.option_key}-text`}
                      />
                      <div className="flex items-start gap-3">
                        <div 
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            isSelected && !showRationale ? 'border-primary bg-primary text-white' :
                            showRationale && isCorrectOption ? 'border-green-500 bg-green-500 text-white' :
                            showRationale && isWrongSelection ? 'border-red-500 bg-red-500 text-white' :
                            'border-muted-foreground'
                          }`}
                          aria-hidden="true"
                        >
                          {option.option_key}
                        </div>
                        <div className="flex-1 text-sm leading-relaxed" id={`option-${option.option_key}-text`}>
                          {option.option_text}
                        </div>
                        
                        {showRationale && isCorrectOption && (
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                        {showRationale && isWrongSelection && (
                          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              {/* Action Buttons */}
              {!showRationale ? (
                <div className="flex gap-3 justify-center">
                  <Button 
                    type="submit" 
                    disabled={!selectedOption || isSubmitting}
                    className="px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleSkipQuestion}
                    disabled={!canGoNext()}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip Question
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleNext}>
                    {canGoNext() ? (
                      <>
                        Next Question
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Complete Exam
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Rationale Section */}
        {showRationale && (
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {currentQuestion.isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Correct!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Incorrect
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Correct Answer: </span>
                  {currentQuestion.correct_answer}
                </div>
                
                {currentQuestion.rationale && (
                  <div>
                    <span className="font-medium">Explanation: </span>
                    {currentQuestion.rationale}
                  </div>
                )}
                
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {currentQuestion.section_id && (
                    <div>
                      <BookOpen className="h-4 w-4 inline mr-1" />
                      Section: {currentQuestion.section_id}
                    </div>
                  )}
                  
                  {currentQuestion.difficulty_level && (
                    <div>
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Difficulty: {currentQuestion.difficulty_level}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              Progress: {Math.round(progress.accuracy || 0)}% accuracy
            </div>
            <Badge variant="outline">
              {progress.correct} correct of {progress.current - 1} answered
            </Badge>
          </div>
          
          <div className="flex gap-3">
            {skippedQuestions.size > 0 && (
              <Badge variant="secondary">
                <Eye className="h-4 w-4 mr-1" />
                {skippedQuestions.size} Skipped
              </Badge>
            )}
            
            <Button 
              variant={canGoNext() ? "outline" : "default"}
              onClick={canGoNext() ? handleNext : handleCompleteExam}
            >
              {canGoNext() ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Complete Exam
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};