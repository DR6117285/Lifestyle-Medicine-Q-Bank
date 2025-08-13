import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizInterface } from '@/components/quiz/QuizInterface';
import { ExamComplete } from '@/components/quiz/ExamComplete';
import { RetryView } from '@/components/quiz/RetryView';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { QuizService } from '@/services/quizService';
import type { QuizMode, Section, QuizSettings } from '@/types/quiz';
import '@/styles/preferences-page.css';

type QuizStep = 'setup' | 'quiz' | 'results' | 'retry-view';

export const QuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Quiz setup state
  const [currentStep, setCurrentStep] = useState<QuizStep>('setup');
  const [selectedMode, setSelectedMode] = useState<QuizMode>('random');
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Quiz store
  const { initializeQuiz, resetQuiz, result, isLoading, error, currentSession, questions } = useQuizStore();

  // Load URL parameters
  useEffect(() => {
    const mode = searchParams.get('mode') as QuizMode;
    if (mode && ['random', 'section', 'timed', 'custom'].includes(mode)) {
      setSelectedMode(mode);
      
      // If custom mode and already initialized, skip setup and go directly to quiz
      if (mode === 'custom' && currentSession && questions.length > 0) {
        setCurrentStep('quiz');
      }
    }
  }, [searchParams, currentSession, questions]);

  // Load sections for section mode
  useEffect(() => {
    const loadSections = async () => {
      if (selectedMode === 'section') {
        try {
          setIsLoadingSections(true);
          const sectionsData = await QuizService.getSections();
          console.log('🔥 Loaded sections for quiz page:', sectionsData);
          
          // Filter out any null, undefined, or duplicate sections
          const validSections = sectionsData.filter((section, index, arr) => 
            section && 
            section.id && 
            section.name &&
            arr.findIndex(s => s.id === section.id) === index // Remove duplicates by id
          );
          
          setSections(validSections);
        } catch (error) {
          console.error('🔥 Failed to load sections:', error);
          setSections([]); // Set empty array on error
        } finally {
          setIsLoadingSections(false);
        }
      }
    };

    loadSections();
  }, [selectedMode]);

  // Start quiz
  const handleStartQuiz = async () => {
    console.log('🔥 Start Quiz button clicked', { user: !!user, selectedMode, selectedSections });
    
    if (!user) {
      alert('Please log in to start a quiz.');
      return;
    }

    if (selectedMode === 'section' && selectedSections.length === 0) {
      alert('Please select at least one section to continue.');
      return;
    }

    const settings: QuizSettings = {
      mode: selectedMode,
      sectionIds: selectedSections.length > 0 ? selectedSections : undefined,
      questionCount,
      timeLimit: selectedMode === 'timed' ? timeLimit : undefined
    };

    try {
      console.log('🔥 Initializing quiz with settings:', settings);
      await initializeQuiz(user.id, settings);
      console.log('🔥 Quiz initialized successfully, moving to quiz step');
      setCurrentStep('quiz');
    } catch (error) {
      console.error('🔥 Failed to start quiz:', error);
      alert(`Failed to start quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = () => {
    setCurrentStep('results');
  };

  // Handle starting new quiz
  const handleStartNewQuiz = () => {
    resetQuiz();
    setCurrentStep('setup');
  };

  // Handle return to dashboard
  const handleReturnHome = () => {
    resetQuiz();
    navigate('/dashboard');
  };

  // Handle exit quiz
  const handleExitQuiz = () => {
    if (confirm('Are you sure you want to exit this quiz? Your progress will be lost.')) {
      resetQuiz();
      setCurrentStep('setup');
    }
  };

  // Handle retry incorrect questions flow
  const handleRetryIncorrect = () => {
    setCurrentStep('retry-view');
  };

  // Handle starting retry session
  const handleStartRetry = () => {
    setCurrentStep('quiz');
  };

  // Handle returning from retry view
  const handleReturnFromRetry = () => {
    setCurrentStep('results');
  };

  // Render current step
  if (currentStep === 'quiz') {
    return (
      <QuizInterface 
        onComplete={handleQuizComplete} 
        onExit={handleExitQuiz}
      />
    );
  }

  if (currentStep === 'results') {
    return (
      <ExamComplete
        onReturnHome={handleReturnHome}
        onRetryIncorrect={handleRetryIncorrect}
        onNewSession={handleStartNewQuiz}
      />
    );
  }

  if (currentStep === 'retry-view') {
    return (
      <RetryView
        onStartRetry={handleStartRetry}
        onReturn={handleReturnFromRetry}
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Setup step - show quiz configuration
  return (
    <div className="preferences-container py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Modern Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-6 shadow-lg preferences-header-icon">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">Practice Quiz</h1>
          <p className="text-xl text-slate-800 font-semibold max-w-2xl mx-auto leading-relaxed">
            Choose your practice mode and start improving your knowledge with our comprehensive medical training system
          </p>
        </div>

        {/* Mode Selection - Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedMode === 'random' 
                ? 'ring-2 ring-primary shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-primary/20' 
                : 'hover:shadow-xl hover:border-primary/20 bg-white/80 backdrop-blur-sm'
            }`}
            onClick={() => setSelectedMode('random')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedMode === 'random' 
                    ? 'bg-gradient-to-br from-primary to-blue-600 shadow-lg' 
                    : 'bg-slate-100 group-hover:bg-primary/10'
                }`}>
                  <Play className={`h-7 w-7 transition-all duration-300 ${
                    selectedMode === 'random' ? 'text-white' : 'text-slate-600 group-hover:text-primary'
                  }`} />
                </div>
                {selectedMode === 'random' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 mb-2">Random Practice</CardTitle>
              <CardDescription className="text-slate-700 font-medium text-base">
                Mixed questions from all sections
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-700 font-medium leading-relaxed mb-4">
                Great for general knowledge testing and discovering weak areas across all medical topics
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                <ArrowRight className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" />
                Best for overall assessment
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedMode === 'section' 
                ? 'ring-2 ring-accent shadow-xl bg-gradient-to-br from-white to-teal-50/30 border-accent/20' 
                : 'hover:shadow-xl hover:border-accent/20 bg-white/80 backdrop-blur-sm'
            }`}
            onClick={() => setSelectedMode('section')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedMode === 'section' 
                    ? 'bg-gradient-to-br from-accent to-teal-600 shadow-lg' 
                    : 'bg-slate-100 group-hover:bg-accent/10'
                }`}>
                  <BookOpen className={`h-7 w-7 transition-all duration-300 ${
                    selectedMode === 'section' ? 'text-white' : 'text-slate-600 group-hover:text-accent'
                  }`} />
                </div>
                {selectedMode === 'section' && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 mb-2">Section Practice</CardTitle>
              <CardDescription className="text-slate-700 font-medium text-base">
                Focus on specific medical topics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-700 font-medium leading-relaxed mb-4">
                Drill down on specific areas where you need improvement and master individual topics
              </p>
              <div className="flex items-center text-sm text-accent font-medium">
                <ArrowRight className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" />
                Perfect for targeted learning
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedMode === 'timed' 
                ? 'ring-2 ring-green-500 shadow-xl bg-gradient-to-br from-white to-green-50/30 border-green-500/20' 
                : 'hover:shadow-xl hover:border-green-500/20 bg-white/80 backdrop-blur-sm'
            }`}
            onClick={() => setSelectedMode('timed')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedMode === 'timed' 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg' 
                    : 'bg-slate-100 group-hover:bg-green-500/10'
                }`}>
                  <Clock className={`h-7 w-7 transition-all duration-300 ${
                    selectedMode === 'timed' ? 'text-white' : 'text-slate-600 group-hover:text-green-500'
                  }`} />
                </div>
                {selectedMode === 'timed' && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 mb-2">Timed Quiz</CardTitle>
              <CardDescription className="text-slate-700 font-medium text-base">
                Simulate real exam conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-700 font-medium leading-relaxed mb-4">
                Practice under time pressure to prepare for real exams and improve your speed
              </p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <ArrowRight className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" />
                Builds exam confidence
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Options - Modern Design */}
        <Card className="preferences-card shadow-xl border-slate-200/60">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">Quiz Configuration</CardTitle>
                <CardDescription className="text-slate-700 font-medium text-base">
                  Customize your practice session for optimal learning
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-0">
            {/* Section Selection (only for section mode) */}
            {selectedMode === 'section' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <label className="text-lg font-semibold text-slate-900">
                      Choose Your Medical Sections
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSections(sections.map(s => s.id))}
                      className="text-xs"
                      disabled={selectedSections.length === sections.length}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSections([])}
                      className="text-xs"
                      disabled={selectedSections.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                {isLoadingSections ? (
                  <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent/20 border-t-accent"></div>
                      <p className="text-slate-600 font-medium">Loading medical sections...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sections.map((section) => {
                      const isSelected = selectedSections.includes(section.id);
                      const handleToggleSection = () => {
                        setSelectedSections(prev => 
                          isSelected 
                            ? prev.filter(id => id !== section.id)
                            : [...prev, section.id]
                        );
                      };

                      return (
                        <div
                          key={section.id}
                          className={`group p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                            isSelected
                              ? 'border-accent bg-gradient-to-br from-teal-50 to-teal-100/50 shadow-lg ring-1 ring-accent/20'
                              : 'border-slate-200 hover:border-accent/50 hover:shadow-md bg-white/50 backdrop-blur-sm'
                          }`}
                          onClick={handleToggleSection}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-slate-900 text-lg leading-tight pr-4">{section.name}</h3>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              isSelected 
                                ? 'bg-accent border-accent' 
                                : 'border-slate-300 group-hover:border-accent/50'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-700 font-medium leading-relaxed text-sm">
                            {section.description || 'Comprehensive medical knowledge section covering essential topics'}
                          </p>
                          <div className="flex items-center mt-3 text-xs text-slate-700 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Click to {isSelected ? 'deselect' : 'select'} this section
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Question Count */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-6">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <label className="text-lg font-semibold text-slate-900">
                  Number of Questions
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[10, 20, 30, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`group px-6 py-4 rounded-xl text-center font-bold text-lg transition-all duration-300 hover:scale-[1.05] ${
                      questionCount === count
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg ring-2 ring-primary/20'
                        : 'bg-white/80 text-slate-700 hover:bg-primary/5 border-2 border-slate-200 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-2xl">{count}</span>
                      <span className="text-xs font-medium opacity-80">questions</span>
                      {questionCount === count && (
                        <div className="w-2 h-2 rounded-full bg-white mt-1"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit (only for timed mode) */}
            {selectedMode === 'timed' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-6">
                  <Clock className="w-5 h-5 text-green-600" />
                  <label className="text-lg font-semibold text-slate-900">
                    Time Limit (Minutes)
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[15, 30, 45, 60].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setTimeLimit(minutes)}
                      className={`group px-6 py-4 rounded-xl text-center font-bold text-lg transition-all duration-300 hover:scale-[1.05] ${
                        timeLimit === minutes
                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg ring-2 ring-green-500/20'
                          : 'bg-white/80 text-slate-700 hover:bg-green-500/5 border-2 border-slate-200 hover:border-green-500/30'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">{minutes}</span>
                        <span className="text-xs font-medium opacity-80">minutes</span>
                        {timeLimit === minutes && (
                          <div className="w-2 h-2 rounded-full bg-white mt-1"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200/60 bg-red-50/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Quiz Button */}
        <div className="flex flex-col items-center space-y-6 py-8">
          <Button
            size="lg"
            onClick={handleStartQuiz}
            disabled={
              isLoading || 
              (selectedMode === 'section' && selectedSections.length === 0) ||
              !user
            }
            className="bg-primary text-white px-12 py-6 h-auto rounded-2xl font-bold shadow-2xl hover:shadow-primary/25 hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                <span>Starting Quiz...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span>Start Quiz</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>

          {/* Helper Messages */}
          <div className="text-center space-y-2">
            {selectedMode === 'section' && selectedSections.length === 0 && (
              <p className="text-slate-600 font-medium flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Please select at least one medical section to continue</span>
              </p>
            )}

            {selectedMode === 'section' && selectedSections.length > 0 && (
              <p className="text-slate-600 font-medium flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700">{selectedSections.length} section{selectedSections.length > 1 ? 's' : ''} selected</span>
              </p>
            )}

            {!user && (
              <p className="text-red-600 font-medium flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Please log in to start a quiz</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};