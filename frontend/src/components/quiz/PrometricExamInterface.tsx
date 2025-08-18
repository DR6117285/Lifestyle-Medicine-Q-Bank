import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  AlertTriangle,
  CheckCircle,
  Eye,
  Flag,
  Home,
  Calculator,
  FileText,
  Navigation,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatTime } from '@/lib/utils';
import type { QuizSettings } from '@/types/quiz';

interface PrometricExamInterfaceProps {
  onComplete: (results: any) => void;
  onExit: () => void;
}

interface ExamState {
  isStarted: boolean;
  bookmarkedQuestions: Set<number>;
  skippedQuestions: Set<number>;
  visitedQuestions: Set<number>;
  lastActionTime: Date;
}

const SECTION_WEIGHTS = {
  "Introduction to Lifestyle Medicine": 4, 
  "Fundamentals of Health Behavior Change": 10,
  "Key Clinical Processes in Lifestyle Medicine": 8, 
  "The Role of The Practitioners Health and Community Advocacy": 4, 
  "Nutrition Science Assessment and Prescription Guidelines": 26, 
  "Physical Activity Science and Prescription": 14, 
  "Emotional and Mental Health Assessment and Interventions": 10, 
  "Sleep Health Science and Interventions": 8, 
  "Managing Tobacco Cessation and other Toxic Exposures": 8, 
  "The Role of Connectedness and Positive Psychology": 8
};

const EXAM_CONFIG = {
  timeLimit: 4 * 60, // 4 hours in minutes
  questionCount: 150,
  warningThreshold: 15 // 15 minutes warning
};

export const PrometricExamInterface: React.FC<PrometricExamInterfaceProps> = ({
  onComplete,
  onExit
}) => {
  const { user } = useAuthStore();
  const {
    initializeQuiz,
    getCurrentQuestion,
    getProgress,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    completeQuiz,
    timeRemaining,
    timerActive,
    pauseTimer,
    resumeTimer,
    startTimer,
    isLoading,
    error,
    clearError,
    answers,
    questions,
    currentQuestionIndex,
    currentSession
  } = useQuizStore();

  // Local state
  const [examState, setExamState] = useState<ExamState>({
    isStarted: false,
    bookmarkedQuestions: new Set(),
    skippedQuestions: new Set(),
    visitedQuestions: new Set(),
    lastActionTime: new Date()
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showQuestionNavigator, setShowQuestionNavigator] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const timeWarningShownRef = useRef(false);
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Initialize exam on component mount
  useEffect(() => {
    const initializeExam = async () => {
      console.log('🏥 PrometricExamInterface useEffect triggered:', {
        hasUser: !!user,
        userId: user?.id,
        isInitialized,
        hasCurrentSession: !!currentSession,
        shouldInitialize: !!(user && !isInitialized && !currentSession)
      });
      
      if (!user) {
        console.warn('🏥 No user found, cannot initialize exam');
        return;
      }
      
      if (isInitialized) {
        console.log('🏥 Exam already initialized, skipping');
        return;
      }
      
      if (currentSession) {
        console.log('🏥 Current session exists, skipping initialization');
        return;
      }
      
      try {
        const examSettings: QuizSettings = {
          mode: 'timed',
          questionCount: EXAM_CONFIG.questionCount,
          timeLimit: EXAM_CONFIG.timeLimit
        };
        
        console.log('🏥 Initializing Prometric-style exam with settings:', examSettings);
        console.log('🏥 User details:', { id: user.id, email: user.email });
        
        await initializeQuiz(user.id, examSettings);
        setIsInitialized(true);
        console.log('🏥 Exam initialization completed successfully');
      } catch (error) {
        console.error('🏥 Failed to initialize exam:', error);
        console.error('🏥 Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };

    initializeExam();
  }, [user, initializeQuiz, isInitialized, currentSession]);

  // Update selected answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.get(currentQuestion.id);
      setSelectedAnswer(existingAnswer || '');
      
      // Mark as visited
      setExamState(prev => ({
        ...prev,
        visitedQuestions: new Set([...prev.visitedQuestions, currentQuestion.id]),
        lastActionTime: new Date()
      }));
    }
  }, [currentQuestion, answers]);

  // Time warning
  useEffect(() => {
    if (timeRemaining && timeRemaining <= EXAM_CONFIG.warningThreshold * 60 && !timeWarningShownRef.current) {
      setShowTimeWarning(true);
      timeWarningShownRef.current = true;
    }
  }, [timeRemaining]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && timerActive) {
      handleTimeUp();
    }
  }, [timeRemaining, timerActive]);

  const handleTimeUp = useCallback(async () => {
    try {
      await completeQuiz();
      alert('Time is up! The exam has been submitted automatically.');
      onComplete({});
    } catch (error) {
      console.error('Failed to auto-submit exam:', error);
    }
  }, [completeQuiz, onComplete]);

  const startExam = useCallback(() => {
    setExamState(prev => ({ ...prev, isStarted: true }));
    startTimer();
  }, [startTimer]);

  const handleAnswerSelect = (optionKey: string, optionText: string) => {
    const fullAnswer = `${optionKey}) ${optionText}`;
    setSelectedAnswer(fullAnswer);
    if (currentQuestion) {
      selectAnswer(currentQuestion.id, fullAnswer);
      setExamState(prev => ({
        ...prev,
        lastActionTime: new Date()
      }));
    }
  };

  const handleBookmark = (questionId: number) => {
    setExamState(prev => {
      const newBookmarked = new Set(prev.bookmarkedQuestions);
      if (newBookmarked.has(questionId)) {
        newBookmarked.delete(questionId);
      } else {
        newBookmarked.add(questionId);
      }
      return { ...prev, bookmarkedQuestions: newBookmarked };
    });
  };

  const handleSkipQuestion = () => {
    if (currentQuestion) {
      setExamState(prev => ({
        ...prev,
        skippedQuestions: new Set([...prev.skippedQuestions, currentQuestion.id]),
        lastActionTime: new Date()
      }));
      if (progress.current < progress.total) {
        nextQuestion();
      }
    }
  };

  const handleNextQuestion = () => {
    if (progress.current < progress.total) {
      nextQuestion();
    } else {
      setShowSubmitDialog(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleCompleteExam = async () => {
    const unansweredCount = getUnansweredCount();
    const skippedCount = examState.skippedQuestions.size;
    
    if (unansweredCount > 0 || skippedCount > 0) {
      const message = [];
      if (unansweredCount > 0) message.push(`${unansweredCount} unanswered questions`);
      if (skippedCount > 0) message.push(`${skippedCount} skipped questions`);
      
      if (!window.confirm(`You have ${message.join(' and ')}. Are you sure you want to submit the exam?`)) {
        return;
      }
    }
    
    try {
      const result = await completeQuiz();
      onComplete(result);
    } catch (error) {
      console.error('Failed to complete exam:', error);
      alert('Failed to complete exam. Please try again.');
    }
  };

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return { type: 'unvisited', color: 'border-gray-300 bg-white' };

    const isAnswered = answers.has(question.id);
    const isBookmarked = examState.bookmarkedQuestions.has(question.id);
    const isSkipped = examState.skippedQuestions.has(question.id);
    const isVisited = examState.visitedQuestions.has(question.id);
    const isCurrent = questionIndex === currentQuestionIndex;

    if (isCurrent) {
      return { type: 'current', color: 'border-blue-500 bg-blue-100 text-blue-700 font-bold' };
    } else if (isAnswered && isBookmarked) {
      return { type: 'answered-bookmarked', color: 'border-green-500 bg-green-100 text-green-700' };
    } else if (isAnswered) {
      return { type: 'answered', color: 'border-green-500 bg-green-50 text-green-700' };
    } else if (isBookmarked) {
      return { type: 'bookmarked', color: 'border-yellow-500 bg-yellow-100 text-yellow-700' };
    } else if (isSkipped) {
      return { type: 'skipped', color: 'border-red-400 bg-red-50 text-red-600' };
    } else if (isVisited) {
      return { type: 'visited', color: 'border-gray-400 bg-gray-50 text-gray-600' };
    } else {
      return { type: 'unvisited', color: 'border-gray-300 bg-white text-gray-500' };
    }
  };

  const getUnansweredCount = () => {
    return questions.filter(q => !answers.has(q.id)).length;
  };

  const getBookmarkedCount = () => {
    return examState.bookmarkedQuestions.size;
  };

  const getSkippedQuestions = () => {
    return Array.from(examState.skippedQuestions).map(id => {
      const index = questions.findIndex(q => q.id === id);
      return { id, index: index + 1 };
    }).filter(item => item.index > 0);
  };

  const getTimeRemainingColor = () => {
    if (!timeRemaining) return 'text-gray-600';
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 900) return 'text-orange-600'; // Less than 15 minutes
    if (timeRemaining < 3600) return 'text-yellow-600'; // Less than 1 hour
    return 'text-green-600';
  };

  // Show start screen if exam hasn't started
  if (!examState.isStarted && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">
              <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              Lifestyle Medicine Certification Exam
            </CardTitle>
            <p className="text-lg text-gray-600">Computer-Based Testing (CBT)</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-6 border rounded-lg bg-blue-50">
                <Clock className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <div className="text-2xl font-bold text-blue-700">{EXAM_CONFIG.timeLimit / 60} Hours</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
              <div className="p-6 border rounded-lg bg-green-50">
                <FileText className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <div className="text-2xl font-bold text-green-700">{EXAM_CONFIG.questionCount}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="p-6 border rounded-lg bg-purple-50">
                <Calculator className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <div className="text-2xl font-bold text-purple-700">Multiple Choice</div>
                <div className="text-sm text-gray-600">Question Type</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-2">Important Instructions:</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>You have {EXAM_CONFIG.timeLimit / 60} hours to complete all {EXAM_CONFIG.questionCount} questions</li>
                    <li>You can bookmark questions for later review</li>
                    <li>Use the question navigator to jump to specific questions</li>
                    <li>Skipped questions will be clearly marked</li>
                    <li>The timer will be visible throughout the exam</li>
                    <li>The exam will auto-submit when time expires</li>
                  </ul>
                </div>
              </div>
            </div>



            {questions.length === 0 ? (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <div className="font-semibold mb-2">No Questions Available</div>
                      <p>The exam database is currently empty. Please contact your administrator to load the question bank.</p>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-12 text-lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/quiz'}
                >
                  Try Regular Quiz Mode Instead
                </Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
                onClick={startExam}
              >
                Begin Examination
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Preparing Your Exam</h2>
              <p className="text-gray-600">Loading {EXAM_CONFIG.questionCount} questions...</p>
            </div>
            
            {/* Debug information */}
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <div className="space-y-1 text-gray-700">
                <div>User: {user ? `${user.email} (${user.id})` : 'Not authenticated'}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
                <div>Current Session: {currentSession ? `Session ${currentSession.id}` : 'None'}</div>
                <div>Questions Loaded: {questions?.length || 0}</div>
                <div>Current Question Index: {currentQuestionIndex}</div>
                <div>Error: {error || 'None'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Exam Setup Failed</h2>
            <p className="text-red-600/80 mb-4">{error}</p>
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

  if (!currentQuestion && examState.isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg border-orange-200 bg-orange-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-orange-700">No Questions Available</h2>
              <p className="text-orange-600 mb-4">
                The exam database appears to be empty. Please contact your administrator to load the question bank.
              </p>
            </div>
            
            {/* Debug information */}
            <div className="bg-orange-100 p-4 rounded-lg text-sm mb-6">
              <h3 className="font-semibold mb-2 text-orange-800">Debug Information:</h3>
              <div className="space-y-1 text-orange-700">
                <div>User: {user ? `${user.email} (${user.id})` : 'Not authenticated'}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
                <div>Exam Started: {examState.isStarted ? 'Yes' : 'No'}</div>
                <div>Current Session: {currentSession ? `Session ${currentSession.id}` : 'None'}</div>
                <div>Questions Loaded: {questions?.length || 0}</div>
                <div>Current Question Index: {currentQuestionIndex}</div>
                <div>Current Question: {currentQuestion ? `ID ${currentQuestion.id}` : 'None'}</div>
                <div>Error: {error || 'None'}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={onExit} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
              <p className="text-sm text-orange-600 text-center">
                Alternative: Try the <a href="/quiz" className="underline font-medium">regular quiz mode</a> instead.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                LM Certification Exam
              </Badge>
            </div>
            
            {/* Center: Timer */}
            <div className={cn(
              "flex items-center gap-2 font-mono text-2xl font-bold px-4 py-2 rounded-lg border-2",
              getTimeRemainingColor(),
              timeRemaining && timeRemaining < 3600 ? "bg-yellow-50 border-yellow-300" : "bg-gray-50 border-gray-300"
            )}>
              <Clock className="h-6 w-6" />
              <span>{formatTime(timeRemaining || 0)}</span>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionNavigator(true)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigator
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitDialog(true)}
              >
                Exit
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Question {progress.current} of {progress.total}</span>
              <div className="flex gap-4">
                <span>Answered: {progress.total - getUnansweredCount()}</span>
                <span>Bookmarked: {getBookmarkedCount()}</span>
                <span>Skipped: {examState.skippedQuestions.size}</span>
              </div>
            </div>
            <Progress value={progress.percentage} className="h-1.5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg leading-relaxed">
                <span className="text-sm text-gray-500 block mb-2">
                  Question {progress.current} of {progress.total}
                </span>
                {currentQuestion.question_text}
              </CardTitle>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant={examState.bookmarkedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBookmark(currentQuestion.id)}
                  className={cn(
                    examState.bookmarkedQuestions.has(currentQuestion.id) && 
                    "bg-yellow-500 hover:bg-yellow-600 text-white"
                  )}
                >
                  {examState.bookmarkedQuestions.has(currentQuestion.id) ? 
                    <BookmarkCheck className="h-4 w-4" /> : 
                    <Bookmark className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Answer Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer.startsWith(option.option_key);
                
                return (
                  <label
                    key={option.option_key}
                    className={cn(
                      "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => handleAnswerSelect(option.option_key, option.option_text)}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0",
                      isSelected 
                        ? "border-blue-500 bg-blue-500 text-white" 
                        : "border-gray-400"
                    )}>
                      {option.option_key}
                    </div>
                    <div className="flex-1 text-sm leading-relaxed">
                      {option.option_text}
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              disabled={progress.current >= progress.total}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            
            <Button
              onClick={handleNextQuestion}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {progress.current < progress.total ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Exam
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Question Navigator Dialog */}
      <Dialog open={showQuestionNavigator} onOpenChange={setShowQuestionNavigator}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Navigator</DialogTitle>
            <DialogDescription>
              Click on any question number to navigate directly to that question.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 bg-blue-100 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-500 bg-green-50 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-100 rounded"></div>
                <span>Bookmarked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-400 bg-red-50 rounded"></div>
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 bg-gray-50 rounded"></div>
                <span>Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 bg-white rounded"></div>
                <span>Not Visited</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-20 gap-2">
              {questions.map((question, index) => {
                const status = getQuestionStatus(index);
                return (
                  <Button
                    key={question.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      goToQuestion(index);
                      setShowQuestionNavigator(false);
                    }}
                    className={cn(
                      "h-10 w-10 p-0 text-sm font-medium",
                      status.color
                    )}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>

            {/* Skipped Questions Quick Access */}
            {getSkippedQuestions().length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 text-red-600">
                  Skipped Questions ({getSkippedQuestions().length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getSkippedQuestions().map(({ id, index }) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        goToQuestion(index - 1);
                        setShowQuestionNavigator(false);
                      }}
                      className="h-8 px-3 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Q{index}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Warning Dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Time Warning
            </DialogTitle>
            <DialogDescription>
              You have {Math.floor((timeRemaining || 0) / 60)} minutes remaining to complete the exam.
              Please manage your time accordingly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)}>
              Continue Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Exit Exam?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to exit the exam? Your progress will be lost and this attempt will be recorded as incomplete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onExit}>
              Exit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you ready to submit your exam? Once submitted, you cannot make any changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.total - getUnansweredCount()}
                </div>
                <div className="text-sm text-gray-600">Answered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {getUnansweredCount()}
                </div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {getBookmarkedCount()}
                </div>
                <div className="text-sm text-gray-600">Bookmarked</div>
              </div>
            </div>
            
            {(getUnansweredCount() > 0 || examState.skippedQuestions.size > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  You have {getUnansweredCount()} unanswered questions and {examState.skippedQuestions.size} skipped questions.
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Review Answers
            </Button>
            <Button onClick={handleCompleteExam} className="bg-green-600 hover:bg-green-700">
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrometricExamInterface;