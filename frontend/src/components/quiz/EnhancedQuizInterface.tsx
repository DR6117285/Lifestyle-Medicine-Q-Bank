import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Flag,
  RotateCcw,
  Lightbulb,
  Keyboard,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/components/ui/Toast';
import { useQuizStore } from '@/stores/quizStore';
import { cn } from '@/lib/utils';

interface EnhancedQuizInterfaceProps {
  className?: string;
}

export const EnhancedQuizInterface: React.FC<EnhancedQuizInterfaceProps> = ({ 
  className 
}) => {
  const {
    getCurrentQuestion,
    getProgress,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    canGoNext,
    canGoPrevious,
    isQuestionAnswered,
    getQuestionAnswer,
    questions,
    currentQuestionIndex,
    timeRemaining,
    timerActive,
    pauseTimer,
    resumeTimer,
    showRationale,
    isLoading,
    error
  } = useQuizStore();

  const { success, error: showError, info } = useToastHelpers();
  
  // UI State
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Format time remaining
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (currentQuestion && currentQuestion.options) {
            const optionIndex = parseInt(e.key) - 1;
            if (optionIndex < currentQuestion.options.length) {
              const option = currentQuestion.options[optionIndex];
              setSelectedOption(option);
              selectAnswer(currentQuestion.id, option);
            }
          }
          break;
        case 'ArrowLeft':
          if (canGoPrevious()) {
            previousQuestion();
          }
          break;
        case 'ArrowRight':
          if (canGoNext()) {
            nextQuestion();
          }
          break;
        case 'Enter':
        case ' ':
          if (selectedOption && !showRationale) {
            handleSubmitAnswer();
          }
          break;
        case 'f':
        case 'F':
          if (currentQuestion) {
            toggleFlag(currentQuestion.id);
          }
          break;
        case '?':
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, selectedOption, showRationale, canGoNext, canGoPrevious]);

  // Initialize selected option when question changes
  useEffect(() => {
    if (currentQuestion) {
      const savedAnswer = getQuestionAnswer(currentQuestion.id);
      setSelectedOption(savedAnswer || '');
    }
  }, [currentQuestion, getQuestionAnswer]);

  const handleOptionSelect = useCallback((option: string) => {
    if (!currentQuestion || showRationale) return;
    
    setSelectedOption(option);
    selectAnswer(currentQuestion.id, option);
  }, [currentQuestion, showRationale, selectAnswer]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !selectedOption) {
      showError('Please select an answer', 'You must choose an option before submitting.');
      return;
    }

    try {
      await submitAnswer();
      success('Answer submitted!', 'Your response has been recorded.');
    } catch (error) {
      showError('Submission failed', 'Please try again.');
    }
  }, [currentQuestion, selectedOption, submitAnswer, success, showError]);

  const toggleFlag = useCallback((questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
        info('Question unflagged', 'Removed flag for review.');
      } else {
        newSet.add(questionId);
        info('Question flagged', 'Marked for review.');
      }
      return newSet;
    });
  }, [info]);

  const handleQuestionNavigation = useCallback((index: number) => {
    goToQuestion(index);
    setShowQuestionList(false);
  }, [goToQuestion]);

  // Memoized question list for performance
  const questionList = useMemo(() => 
    questions.map((question, index) => ({
      index,
      id: question.id,
      isAnswered: isQuestionAnswered(question.id),
      isCorrect: question.isCorrect,
      isFlagged: flaggedQuestions.has(question.id),
      isCurrent: index === currentQuestionIndex
    }))
  , [questions, isQuestionAnswered, flaggedQuestions, currentQuestionIndex]);

  if (isLoading) {
    return <div>Loading quiz...</div>;
  }

  if (error) {
    return <div className="text-error-600">Error: {error}</div>;
  }

  if (!currentQuestion) {
    return <div>No question available</div>;
  }

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header with Progress and Timer */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-medical-600" />
                <span className="font-medium">
                  Question {progress.current} of {progress.total}
                </span>
              </div>
              {timeRemaining && (
                <div className="flex items-center space-x-2">
                  <Clock className={cn(
                    "h-5 w-5",
                    timeRemaining < 300 ? "text-error-600" : "text-medical-600"
                  )} />
                  <span className={cn(
                    "font-mono font-medium",
                    timeRemaining < 300 ? "text-error-600" : "text-foreground"
                  )}>
                    {formatTime(timeRemaining)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={timerActive ? pauseTimer : resumeTimer}
                  >
                    {timerActive ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQuestionList(!showQuestionList)}
              >
                <Eye className="h-4 w-4" />
                {showQuestionList ? 'Hide' : 'Show'} Questions
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress.percentage)}%</span>
              <span>Accuracy: {Math.round(progress.accuracy)}%</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <Card className="border-medical-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><kbd className="kbd">1-5</kbd> Select answer option</div>
              <div><kbd className="kbd">←/→</kbd> Previous/Next question</div>
              <div><kbd className="kbd">Enter/Space</kbd> Submit answer</div>
              <div><kbd className="kbd">F</kbd> Flag for review</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question List Panel */}
      {showQuestionList && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questionList.map(({ index, id, isAnswered, isCorrect, isFlagged, isCurrent }) => (
                <Button
                  key={id}
                  size="sm"
                  variant={isCurrent ? "default" : "outline"}
                  onClick={() => handleQuestionNavigation(index)}
                  className={cn(
                    "relative h-12 w-12 p-0",
                    isCurrent && "ring-2 ring-medical-500",
                    isAnswered && isCorrect === true && "bg-success-100 border-success-300 text-success-700",
                    isAnswered && isCorrect === false && "bg-error-100 border-error-300 text-error-700",
                    isFlagged && "ring-2 ring-warning-400"
                  )}
                >
                  {index + 1}
                  {isFlagged && (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning-600" />
                  )}
                  {isAnswered && (
                    <div className="absolute -bottom-1 -right-1">
                      {isCorrect === true ? (
                        <CheckCircle className="h-3 w-3 text-success-600" />
                      ) : isCorrect === false ? (
                        <XCircle className="h-3 w-3 text-error-600" />
                      ) : null}
                    </div>
                  )}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success-200 rounded" />
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-error-200 rounded" />
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-3 h-3 text-warning-600" />
                <span>Flagged</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.questionText}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleFlag(currentQuestion.id)}
              className={cn(
                flaggedQuestions.has(currentQuestion.id) && "bg-warning-100 border-warning-300 text-warning-700"
              )}
            >
              <Flag className="h-4 w-4" />
              {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
            </Button>
          </div>
          
          {/* Metadata badges */}
          <div className="flex gap-2 flex-wrap">
            {currentQuestion.category && (
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            )}
            {currentQuestion.difficulty && (
              <Badge 
                variant="outline"
                className={cn(
                  currentQuestion.difficulty === 'easy' && "border-success-300 text-success-700",
                  currentQuestion.difficulty === 'medium' && "border-warning-300 text-warning-700",
                  currentQuestion.difficulty === 'hard' && "border-error-300 text-error-700"
                )}
              >
                {currentQuestion.difficulty}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <div
                key={option}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  selectedOption === option 
                    ? "border-medical-500 bg-medical-50" 
                    : "border-border hover:border-medical-300 hover:bg-muted/50",
                  showRationale && selectedOption === option && currentQuestion.isCorrect === false 
                    ? "border-error-500 bg-error-50"
                    : "",
                  showRationale && option === currentQuestion.correctAnswer
                    ? "border-success-500 bg-success-50"
                    : ""
                )}
                onClick={() => handleOptionSelect(option)}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                  selectedOption === option 
                    ? "border-medical-500 bg-medical-500 text-white" 
                    : "border-muted-foreground"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 text-left">{option}</div>
                
                {/* Show result indicators after submission */}
                {showRationale && (
                  <div className="flex-shrink-0">
                    {option === currentQuestion.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    )}
                    {selectedOption === option && currentQuestion.isCorrect === false && (
                      <XCircle className="h-5 w-5 text-error-600" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confidence Level (only show before submission) */}
          {!showRationale && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                How confident are you in your answer?
              </label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={confidenceLevel === level ? "default" : "outline"}
                    onClick={() => setConfidenceLevel(level as typeof confidenceLevel)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Rationale (shown after submission) */}
          {showRationale && currentQuestion.rationale && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border-l-4 border-medical-500">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-5 w-5 text-medical-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-medical-900 mb-2">Explanation</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentQuestion.rationale}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={!canGoPrevious()}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!showRationale ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="gap-2 bg-medical-600 hover:bg-medical-700"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={!canGoNext()}
                  className="gap-2"
                >
                  Next Question
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};