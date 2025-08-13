import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuizService } from '../services/quizService';
import { useStatisticsStore } from './statisticsStore';
import type { 
  QuizState,
  QuizSettings,
  Question,
  QuizSession,
  QuizAttempt,
  QuizResult,
  ProcessedQuestion
} from '../types/quiz';

interface QuizStore extends QuizState {
  // Actions
  initializeQuiz: (userId: string, settings: QuizSettings) => Promise<void>;
  selectAnswer: (questionId: number, answer: string) => void;
  submitAnswer: () => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  completeQuiz: () => Promise<QuizResult>;
  resetQuiz: () => void;
  clearError: () => void;
  
  // Timer management
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  
  // Utility getters
  getCurrentQuestion: () => ProcessedQuestion | null;
  getProgress: () => { current: number; total: number; percentage: number; correct: number; accuracy: number };
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  isQuestionAnswered: (questionId: number) => boolean;
  getQuestionAnswer: (questionId: number) => string | undefined;
  
  // Retry functionality
  getIncorrectQuestions: () => ProcessedQuestion[];
  startRetrySession: () => void;
  isRetryMode: boolean;
}

// Timer interval reference
let timerInterval: NodeJS.Timeout | null = null;

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      attempts: [],
      timeRemaining: undefined,
      timerActive: false,
      isLoading: false,
      error: null,
      showRationale: false,
      quizCompleted: false,
      result: null,
      isRetryMode: false,

      // Initialize quiz with settings
      initializeQuiz: async (userId: string, settings: QuizSettings) => {
        try {
          console.log('[QUIZ] Initializing quiz for user:', userId, 'with settings:', settings);
          set({ isLoading: true, error: null });

          // Create quiz session
          const session = await QuizService.createQuizSession(userId, settings);
          console.log('[QUIZ] Quiz session created:', session.id);
          
          // Fetch questions
          const questions = await QuizService.fetchQuestions(settings);
          
          if (questions.length === 0) {
            throw new Error('No questions found for the selected criteria');
          }

          console.log(`[QUIZ] Fetched ${questions.length} questions`);

          // Initialize timer if timed mode
          const timeRemaining = settings.mode === 'timed' && settings.timeLimit 
            ? settings.timeLimit * 60 
            : undefined;

          if (timeRemaining) {
            console.log(`[QUIZ] Timer initialized for ${settings.timeLimit} minutes (${timeRemaining}s)`);
          }

          set({
            currentSession: session,
            questions,
            currentQuestionIndex: 0,
            answers: new Map(),
            attempts: [],
            timeRemaining,
            timerActive: false,
            isLoading: false,
            error: null,
            showRationale: false,
            quizCompleted: false,
            result: null
          });

          // Start timer for timed mode
          if (settings.mode === 'timed' && timeRemaining) {
            get().startTimer();
          }

        } catch (error) {
          console.error('[QUIZ] Error initializing quiz:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize quiz'
          });
        }
      },

      // Select an answer for the current question
      selectAnswer: (questionId: number, answer: string) => {
        const { answers } = get();
        const newAnswers = new Map(answers);
        newAnswers.set(questionId, answer);
        set({ answers: newAnswers });
      },

      // Submit the current answer and save attempt
      submitAnswer: async () => {
        try {
          const { 
            currentSession, 
            questions, 
            currentQuestionIndex, 
            answers,
            attempts 
          } = get();

          if (!currentSession) {
            throw new Error('No active quiz session');
          }

          const currentQuestion = questions[currentQuestionIndex];
          if (!currentQuestion) {
            throw new Error('No current question');
          }

          const selectedAnswer = answers.get(currentQuestion.id);
          if (!selectedAnswer) {
            throw new Error('Please select an answer');
          }

          // Calculate time taken (simplified - could implement proper per-question timing)
          const timeTaken = Math.floor(Math.random() * 60) + 30; // 30-90 seconds as placeholder

          // Validate answer
          const isCorrect = QuizService.validateAnswer(currentQuestion, selectedAnswer);

          // Create attempt
          const attemptData = {
            session_id: currentSession.id,
            question_id: currentQuestion.id,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            time_taken: timeTaken
          };

          // Save to database
          const attempt = await QuizService.saveQuizAttempt(attemptData);

          // Update question with correct/incorrect status
          const updatedQuestions = questions.map(q => 
            q.id === currentQuestion.id 
              ? { ...q, isAnswered: true, isCorrect: isCorrect }
              : q
          );

          // Update local state
          set({
            questions: updatedQuestions,
            attempts: [...attempts, attempt],
            showRationale: true
          });

        } catch (error) {
          console.error('[QUIZ] Error submitting answer:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to submit answer'
          });
        }
      },

      // Navigate to next question
      nextQuestion: () => {
        const { currentQuestionIndex, questions, answers } = get();
        if (currentQuestionIndex < questions.length - 1) {
          const newIndex = currentQuestionIndex + 1;
          const nextQuestion = questions[newIndex];
          const isAnswered = answers.has(nextQuestion.id);
          
          console.log(`[QUIZ] Moving to next question: ${newIndex + 1}/${questions.length}`);
          set({
            currentQuestionIndex: newIndex,
            showRationale: isAnswered
          });
        }
      },

      // Navigate to previous question
      previousQuestion: () => {
        const { currentQuestionIndex, questions, answers } = get();
        if (currentQuestionIndex > 0) {
          const newIndex = currentQuestionIndex - 1;
          const previousQuestion = questions[newIndex];
          const isAnswered = answers.has(previousQuestion.id);
          
          console.log(`[QUIZ] Moving to previous question: ${newIndex + 1}/${questions.length}`);
          set({
            currentQuestionIndex: newIndex,
            showRationale: isAnswered
          });
        }
      },

      // Go to specific question
      goToQuestion: (index: number) => {
        const { questions, answers } = get();
        if (index >= 0 && index < questions.length) {
          const targetQuestion = questions[index];
          const isAnswered = answers.has(targetQuestion.id);
          
          set({
            currentQuestionIndex: index,
            showRationale: isAnswered
          });
        }
      },

      // Pause timer
      pauseTimer: () => {
        const { timeRemaining } = get();
        console.log(`[QUIZ] Timer paused with ${timeRemaining}s remaining`);
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        set({ timerActive: false });
      },

      // Resume timer
      resumeTimer: () => {
        const { timeRemaining } = get();
        console.log(`[QUIZ] Timer resumed with ${timeRemaining}s remaining`);
        get().startTimer();
      },

      // Complete quiz and calculate results
      completeQuiz: async () => {
        try {
          const { currentSession, questions, answers } = get();
          if (!currentSession) {
            throw new Error('No active quiz session');
          }

          console.log('[QUIZ] Completing quiz session:', currentSession.id);
          console.log(`[QUIZ] Questions answered: ${answers.size}/${questions.length}`);

          // Stop timer
          get().stopTimer();

          // Calculate results
          const result = await QuizService.completeQuizSession(currentSession.id);
          console.log('[QUIZ] Quiz completed with result:', result);

          set({
            quizCompleted: true,
            result,
            timerActive: false
          });

          // Refresh user statistics in background
          QuizService.refreshUserStatistics();
          
          // Notify statistics store to refresh
          const statisticsStore = useStatisticsStore.getState();
          if (currentSession.user_id) {
            statisticsStore.handleQuizCompletion(currentSession.user_id);
          }

          return result;

        } catch (error) {
          console.error('[QUIZ] Error completing quiz:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to complete quiz';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Reset quiz to initial state
      resetQuiz: () => {
        console.log('[QUIZ] Resetting quiz state');
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        set({
          currentSession: null,
          questions: [],
          currentQuestionIndex: 0,
          answers: new Map(),
          attempts: [],
          timeRemaining: undefined,
          timerActive: false,
          isLoading: false,
          error: null,
          showRationale: false,
          quizCompleted: false,
          result: null,
          isRetryMode: false
        });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Timer management
      startTimer: () => {
        const { timeRemaining } = get();
        if (timeRemaining && timeRemaining > 0) {
          set({ timerActive: true });
          timerInterval = setInterval(() => {
            get().tickTimer();
          }, 1000);
        }
      },

      stopTimer: () => {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        set({ timerActive: false });
      },

      tickTimer: () => {
        const { timeRemaining } = get();
        if (timeRemaining && timeRemaining > 0) {
          const newTime = timeRemaining - 1;
          set({ timeRemaining: newTime });
          
          // Auto-complete quiz when time runs out
          if (newTime <= 0) {
            get().completeQuiz();
          }
        }
      },

      // Utility getters
      getCurrentQuestion: () => {
        const { questions, currentQuestionIndex, answers, attempts } = get();
        const question = questions[currentQuestionIndex];
        
        if (!question) return null;

        const selectedAnswer = answers.get(question.id);
        const attempt = attempts.find(a => a.question_id === question.id);

        return {
          ...question,
          selectedAnswer,
          isAnswered: !!selectedAnswer,
          isCorrect: attempt?.is_correct
        };
      },

      getProgress: () => {
        const { currentQuestionIndex, questions, answers } = get();
        const current = currentQuestionIndex + 1;
        const total = questions.length;
        const percentage = total > 0 ? (current / total) * 100 : 0;
        
        // Calculate accuracy based on answered questions
        let correct = 0;
        let answered = 0;
        
        questions.forEach(question => {
          if (answers.has(question.id)) {
            answered++;
            if (question.isCorrect) {
              correct++;
            }
          }
        });
        
        const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
        
        return { current, total, percentage, correct, accuracy };
      },

      canGoNext: () => {
        const { currentQuestionIndex, questions } = get();
        return currentQuestionIndex < questions.length - 1;
      },

      canGoPrevious: () => {
        const { currentQuestionIndex } = get();
        return currentQuestionIndex > 0;
      },

      isQuestionAnswered: (questionId: number) => {
        const { answers } = get();
        return answers.has(questionId);
      },

      getQuestionAnswer: (questionId: number) => {
        const { answers } = get();
        return answers.get(questionId);
      },

      // Get all incorrectly answered questions
      getIncorrectQuestions: () => {
        const { questions } = get();
        return questions.filter(question => 
          question.isAnswered && question.isCorrect === false
        );
      },

      // Start a retry session with only incorrect questions
      startRetrySession: () => {
        const { questions } = get();
        const incorrectQuestions = questions.filter(question => 
          question.isAnswered && question.isCorrect === false
        );

        if (incorrectQuestions.length === 0) {
          console.log('[QUIZ] No incorrect questions to retry');
          return; // No incorrect questions to retry
        }

        console.log(`[QUIZ] Starting retry session with ${incorrectQuestions.length} incorrect questions`);

        // Reset questions for retry (clear previous answers but keep original state)
        const resetQuestions = incorrectQuestions.map(question => ({
          ...question,
          isAnswered: false,
          isCorrect: undefined,
          selectedAnswer: undefined
        }));

        // Clear answers for incorrect questions only
        const { answers } = get();
        const newAnswers = new Map(answers);
        incorrectQuestions.forEach(q => newAnswers.delete(q.id));

        set({
          questions: resetQuestions,
          currentQuestionIndex: 0,
          answers: newAnswers,
          showRationale: false,
          isRetryMode: true,
          quizCompleted: false
        });
      }
    }),
    {
      name: 'lmqb-quiz-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for quiz state
      partialize: (state) => ({
        currentSession: state.currentSession,
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: Array.from(state.answers.entries()), // Convert Map to Array for serialization
        attempts: state.attempts,
        timeRemaining: state.timeRemaining,
        quizCompleted: state.quizCompleted,
        result: state.result
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert answers back to Map
          if (Array.isArray((state as any).answers)) {
            (state as any).answers = new Map((state as any).answers);
          } else if (!(state.answers instanceof Map)) {
            // Ensure answers is always a Map
            state.answers = new Map();
          }
          
          // Resume timer if it was active and time remaining
          if (state.timeRemaining && state.timeRemaining > 0 && !state.quizCompleted) {
            // Don't auto-resume timer on reload - user should explicitly resume
            state.timerActive = false;
          }
        }
      },
    }
  )
);