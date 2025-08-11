import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, 
  Save, 
  Pause, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Flag, 
  BookOpen,
  Eye,
  EyeOff,
  RotateCcw,
  FileText,
  Award,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuizStore } from '@/stores/quizStore';
import { useToastHelpers } from '@/components/ui/Toast';
import { useScreenReaderAnnouncements } from '@/components/accessibility/AccessibilityProvider';
import { MemoizedTimerDisplay } from '@/components/optimization/MemoizedComponents';
import { useLocalStorage } from '@/hooks/useOfflineSupport';
import { cn } from '@/lib/utils';

interface EnhancedExamInterfaceProps {
  onComplete: (results: any) => void;
  onExit: () => void;
  examConfig?: {
    timeLimit: number; // minutes
    autoSaveInterval: number; // seconds
    warningThreshold: number; // minutes before end
    allowReview: boolean;
    allowFlagging: boolean;
    showProgress: boolean;
  };
}

interface ExamState {
  isStarted: boolean;
  isPaused: boolean;
  autoSaveEnabled: boolean;
  lastSaved: Date | null;
  flaggedQuestions: Set<number>;
  visitedQuestions: Set<number>;
  confidenceLevels: Map<number, 'low' | 'medium' | 'high'>;
}

const defaultExamConfig = {
  timeLimit: 180, // 3 hours
  autoSaveInterval: 30, // 30 seconds
  warningThreshold: 15, // 15 minutes
  allowReview: true,
  allowFlagging: true,
  showProgress: true,
};

export const EnhancedExamInterface: React.FC<EnhancedExamInterfaceProps> = ({
  onComplete,
  onExit,
  examConfig = defaultExamConfig
}) => {
  const {
    getCurrentQuestion,
    getProgress,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    questions,
    currentQuestionIndex,
    timeRemaining,
    timerActive,
    pauseTimer,
    resumeTimer,
    completeQuiz,
    answers,
    isLoading,
    error
  } = useQuizStore();

  const { success, warning, error: showError, info } = useToastHelpers();
  const { announceAction, announceProgress } = useScreenReaderAnnouncements();
  
  // Local storage for auto-save
  const [examState, setExamState] = useLocalStorage<ExamState>('exam-state', {
    isStarted: false,
    isPaused: false,
    autoSaveEnabled: true,
    lastSaved: null,
    flaggedQuestions: new Set(),
    visitedQuestions: new Set(),
    confidenceLevels: new Map(),
  });

  // UI State
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Refs
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const timeWarningShownRef = useRef(false);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    try {
      // Save current state to localStorage and optionally to server
      const saveData = {
        currentQuestionIndex,
        answers: Array.from(answers.entries()),
        flaggedQuestions: Array.from(examState.flaggedQuestions),
        confidenceLevels: Array.from(examState.confidenceLevels.entries()),
        timeRemaining,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('exam-auto-save', JSON.stringify(saveData));
      
      setExamState(prev => ({
        ...prev,
        lastSaved: new Date()
      }));

      // Show subtle feedback
      info('Progress saved automatically', undefined, { duration: 2000 });
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      warning('Auto-save failed', 'Your progress may not be saved. Please save manually.');
    }
  }, [currentQuestionIndex, answers, examState.flaggedQuestions, examState.confidenceLevels, timeRemaining, setExamState, info, warning]);

  // Set up auto-save interval
  useEffect(() => {
    if (examState.isStarted && examState.autoSaveEnabled && !examState.isPaused) {
      autoSaveIntervalRef.current = setInterval(performAutoSave, examConfig.autoSaveInterval * 1000);
      
      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [examState.isStarted, examState.autoSaveEnabled, examState.isPaused, performAutoSave, examConfig.autoSaveInterval]);

  // Time warning
  useEffect(() => {
    if (timeRemaining && timeRemaining <= examConfig.warningThreshold * 60 && !timeWarningShownRef.current) {
      setShowTimeWarning(true);
      timeWarningShownRef.current = true;
      warning(
        'Time Warning',
        `${Math.floor(timeRemaining / 60)} minutes remaining. Consider reviewing your answers.`,
        { duration: 10000 }
      );
    }
  }, [timeRemaining, examConfig.warningThreshold, warning]);

  // Mark question as visited
  useEffect(() => {
    if (currentQuestion) {
      setExamState(prev => ({
        ...prev,
        visitedQuestions: new Set([...prev.visitedQuestions, currentQuestion.id])
      }));
    }
  }, [currentQuestion, setExamState]);

  const startExam = useCallback(() => {
    setExamState(prev => ({ ...prev, isStarted: true }));
    resumeTimer();
    announceAction('Exam started', 'Timer is now running');
  }, [setExamState, resumeTimer, announceAction]);

  const pauseExam = useCallback(() => {
    setExamState(prev => ({ ...prev, isPaused: true }));
    pauseTimer();
    announceAction('Exam paused', 'Timer has been stopped');
  }, [setExamState, pauseTimer, announceAction]);

  const resumeExam = useCallback(() => {
    setExamState(prev => ({ ...prev, isPaused: false }));
    resumeTimer();
    announceAction('Exam resumed', 'Timer has been started');
  }, [setExamState, resumeTimer, announceAction]);

  const toggleFlag = useCallback((questionId: number) => {
    setExamState(prev => {
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { ...prev, flaggedQuestions: newFlagged };
    });
  }, [setExamState]);

  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswer(answer);
    selectAnswer(currentQuestion!.id, answer);
    
    // Set confidence level
    setExamState(prev => ({
      ...prev,
      confidenceLevels: new Map([...prev.confidenceLevels, [currentQuestion!.id, confidenceLevel]])
    }));
  }, [currentQuestion, selectAnswer, confidenceLevel, setExamState]);

  const handleSubmitExam = useCallback(async () => {
    try {
      pauseTimer();
      const results = await completeQuiz();
      
      // Clear auto-save data
      localStorage.removeItem('exam-auto-save');
      localStorage.removeItem('exam-state');
      
      announceAction('Exam completed', 'Results are being processed');
      onComplete(results);
      
    } catch (error) {
      showError('Submission failed', 'Please try again or contact support.');
    }
  }, [pauseTimer, completeQuiz, announceAction, onComplete, showError]);

  const handleExitExam = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    onExit();
  }, [onExit]);

  const getQuestionStatus = (questionId: number, index: number) => {
    const isAnswered = answers.has(questionId);
    const isFlagged = examState.flaggedQuestions.has(questionId);
    const isVisited = examState.visitedQuestions.has(questionId);
    const isCurrent = index === currentQuestionIndex;
    
    return { isAnswered, isFlagged, isVisited, isCurrent };
  };

  const getUnansweredCount = () => {
    return questions.filter(q => !answers.has(q.id)).length;
  };

  const getFlaggedCount = () => {
    return examState.flaggedQuestions.size;
  };

  // Show start screen if exam hasn't started
  if (!examState.isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <Award className="h-8 w-8 mx-auto mb-4 text-medical-600" />
              Lifestyle Medicine Board Exam
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-medical-600" />
                <div className="font-semibold">{examConfig.timeLimit} Minutes</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="p-4 border rounded-lg">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-medical-600" />
                <div className="font-semibold">{questions.length} Questions</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Auto-save enabled - your progress is saved every {examConfig.autoSaveInterval} seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-warning-600" />
                <span>You can flag questions for review</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-medical-600" />
                <span>Review your answers before submitting</span>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full" 
              onClick={startExam}
              disabled={questions.length === 0}
            >
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Loading exam...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Timer and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MemoizedTimerDisplay
                timeRemaining={timeRemaining || 0}
                isActive={timerActive}
                onPause={pauseExam}
                onResume={resumeExam}
              />
              
              {examState.lastSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Save className="h-4 w-4" />
                  <span>Saved {formatRelativeTime(examState.lastSaved)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReviewDialog(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Review ({getUnansweredCount()} remaining)
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowExitDialog(true)}>
                Exit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {examConfig.showProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress.percentage)}% Complete</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Answered: {progress.current - (getUnansweredCount())}</span>
                <span>Flagged: {getFlaggedCount()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl leading-relaxed flex-1">
              {currentQuestion.questionText}
            </CardTitle>
            
            {examConfig.allowFlagging && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={cn(
                  "flex-shrink-0 ml-4",
                  examState.flaggedQuestions.has(currentQuestion.id) && 
                  "bg-warning-100 text-warning-700"
                )}
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {currentQuestion.category && (
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            )}
            {currentQuestion.difficulty && (
              <Badge variant="outline" className={
                currentQuestion.difficulty === 'easy' ? 'border-success-300 text-success-700' :
                currentQuestion.difficulty === 'medium' ? 'border-warning-300 text-warning-700' :
                'border-error-300 text-error-700'
              }>
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
                  selectedAnswer === option 
                    ? "border-medical-500 bg-medical-50" 
                    : "border-border hover:border-medical-300 hover:bg-muted/50"
                )}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                  selectedAnswer === option 
                    ? "border-medical-500 bg-medical-500 text-white" 
                    : "border-muted-foreground"
                )}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1 text-left">{option}</div>
              </div>
            ))}
          </div>

          {/* Confidence Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confidence Level</Label>
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

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>

            <Button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Review</DialogTitle>
            <DialogDescription>
              Review your progress before submitting the exam.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-10 gap-2 my-6">
            {questions.map((question, index) => {
              const status = getQuestionStatus(question.id, index);
              return (
                <Button
                  key={question.id}
                  size="sm"
                  variant={status.isCurrent ? "default" : "outline"}
                  onClick={() => {
                    goToQuestion(index);
                    setShowReviewDialog(false);
                  }}
                  className={cn(
                    "relative h-12 w-12 p-0",
                    status.isAnswered && "bg-success-100 border-success-300 text-success-700",
                    status.isFlagged && "ring-2 ring-warning-400"
                  )}
                >
                  {index + 1}
                  {status.isFlagged && (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning-600" />
                  )}
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success-600">
                {questions.length - getUnansweredCount()}
              </div>
              <div className="text-sm text-muted-foreground">Answered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning-600">
                {getUnansweredCount()}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-medical-600">
                {getFlaggedCount()}
              </div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Continue Exam
            </Button>
            <Button 
              onClick={handleSubmitExam}
              className="bg-medical-600 hover:bg-medical-700"
            >
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              Exit Exam?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to exit the exam? Your progress has been saved and you can resume later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleExitExam}>
              Exit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString();
};