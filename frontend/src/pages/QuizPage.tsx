import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizInterface } from '@/components/quiz/QuizInterface';
import { QuizResults } from '@/components/quiz/QuizResults';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { QuizService } from '@/services/quizService';
import type { QuizMode, Section, QuizSettings } from '@/types/quiz';

type QuizStep = 'setup' | 'quiz' | 'results';

export const QuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Quiz setup state
  const [currentStep, setCurrentStep] = useState<QuizStep>('setup');
  const [selectedMode, setSelectedMode] = useState<QuizMode>('random');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Quiz store
  const { initializeQuiz, resetQuiz, result, isLoading, error } = useQuizStore();

  // Load URL parameters
  useEffect(() => {
    const mode = searchParams.get('mode') as QuizMode;
    if (mode && ['random', 'section', 'timed'].includes(mode)) {
      setSelectedMode(mode);
    }
  }, [searchParams]);

  // Load sections for section mode
  useEffect(() => {
    const loadSections = async () => {
      if (selectedMode === 'section') {
        try {
          setIsLoadingSections(true);
          const sectionsData = await QuizService.getSections();
          setSections(sectionsData);
        } catch (error) {
          console.error('Failed to load sections:', error);
        } finally {
          setIsLoadingSections(false);
        }
      }
    };

    loadSections();
  }, [selectedMode]);

  // Start quiz
  const handleStartQuiz = async () => {
    if (!user) {
      alert('Please log in to start a quiz.');
      return;
    }

    if (selectedMode === 'section' && !selectedSection) {
      alert('Please select a section to continue.');
      return;
    }

    const settings: QuizSettings = {
      mode: selectedMode,
      sectionId: selectedSection || undefined,
      questionCount,
      timeLimit: selectedMode === 'timed' ? timeLimit : undefined
    };

    try {
      await initializeQuiz(user.id, settings);
      setCurrentStep('quiz');
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('Failed to start quiz. Please try again.');
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

  // Render current step
  if (currentStep === 'quiz') {
    return (
      <QuizInterface 
        onComplete={handleQuizComplete} 
        onExit={handleExitQuiz}
      />
    );
  }

  if (currentStep === 'results' && result) {
    return (
      <QuizResults 
        result={result}
        onStartNew={handleStartNewQuiz}
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Setup step - show quiz configuration
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Practice Quiz</h1>
        <p className="text-gray-600 mt-2">
          Choose your practice mode and start improving your knowledge
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className={`cursor-pointer transition-all ${
            selectedMode === 'random' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedMode('random')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMode === 'random' ? 'bg-blue-500' : 'bg-gray-100'
              }`}>
                <Play className={`h-5 w-5 ${
                  selectedMode === 'random' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">Random Practice</CardTitle>
                <CardDescription>Mixed questions from all sections</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Great for general knowledge testing and discovering weak areas
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            selectedMode === 'section' ? 'ring-2 ring-purple-500 shadow-md' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedMode('section')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMode === 'section' ? 'bg-purple-500' : 'bg-gray-100'
              }`}>
                <BookOpen className={`h-5 w-5 ${
                  selectedMode === 'section' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">Section Practice</CardTitle>
                <CardDescription>Focus on specific topics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Drill down on specific areas where you need improvement
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            selectedMode === 'timed' ? 'ring-2 ring-green-500 shadow-md' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedMode('timed')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMode === 'timed' ? 'bg-green-500' : 'bg-gray-100'
              }`}>
                <Clock className={`h-5 w-5 ${
                  selectedMode === 'timed' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">Timed Quiz</CardTitle>
                <CardDescription>Simulate exam conditions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Practice under time pressure to prepare for real exams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Configuration</CardTitle>
          <CardDescription>
            Customize your practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section Selection (only for section mode) */}
          {selectedMode === 'section' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Section
              </label>
              {isLoadingSections ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedSection === section.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <p className="font-medium text-gray-900">{section.name}</p>
                      <p className="text-sm text-gray-500">
                        {section.description || 'No description available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <div className="flex space-x-4">
              {[10, 20, 30, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    questionCount === count
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit (only for timed mode) */}
          {selectedMode === 'timed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <div className="flex space-x-4">
                {[15, 30, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setTimeLimit(minutes)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeLimit === minutes
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Start Quiz Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStartQuiz}
          disabled={
            isLoading || 
            (selectedMode === 'section' && !selectedSection) ||
            !user
          }
          className="px-8 py-3 text-lg"
        >
          {isLoading ? 'Starting Quiz...' : 'Start Quiz'}
          {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>

      {/* Helper messages */}
      {selectedMode === 'section' && !selectedSection && (
        <p className="text-center text-sm text-gray-500">
          Please select a section to continue
        </p>
      )}

      {!user && (
        <p className="text-center text-sm text-red-500">
          Please log in to start a quiz
        </p>
      )}
    </div>
  );
};