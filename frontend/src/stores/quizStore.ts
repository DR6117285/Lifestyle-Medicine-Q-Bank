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
  getProgress: () => { current: number; total: number; percentage: number };
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  isQuestionAnswered: (questionId: number) => boolean;
  getQuestionAnswer: (questionId: number) => string | undefined;
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

      // Initialize quiz with settings
      initializeQuiz: async (userId: string, settings: QuizSettings) => {
        try {
          set({ isLoading: true, error: null });

          // Create quiz session
          const session = await QuizService.createQuizSession(userId, settings);
          
          // Fetch questions
          const questions = await QuizService.fetchQuestions(settings);
          
          if (questions.length === 0) {
            throw new Error('No questions found for the selected criteria');
          }

          // Initialize timer if timed mode
          const timeRemaining = settings.mode === 'timed' && settings.timeLimit 
            ? settings.timeLimit * 60 
            : undefined;

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
          console.error('Error initializing quiz:', error);
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

          // Update local state
          set({
            attempts: [...attempts, attempt],
            showRationale: true
          });

        } catch (error) {
          console.error('Error submitting answer:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to submit answer'
          });
        }
      },

      // Navigate to next question
      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({
            currentQuestionIndex: currentQuestionIndex + 1,
            showRationale: false
          });
        }
      },

      // Navigate to previous question
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({
            currentQuestionIndex: currentQuestionIndex - 1,
            showRationale: false
          });
        }
      },

      // Go to specific question
      goToQuestion: (index: number) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({
            currentQuestionIndex: index,
            showRationale: false
          });
        }
      },

      // Pause timer
      pauseTimer: () => {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        set({ timerActive: false });
      },

      // Resume timer
      resumeTimer: () => {
        get().startTimer();
      },

      // Complete quiz and calculate results
      completeQuiz: async () => {
        try {
          const { currentSession } = get();
          if (!currentSession) {
            throw new Error('No active quiz session');
          }

          // Stop timer
          get().stopTimer();

          // Calculate results
          const result = await QuizService.completeQuizSession(currentSession.id);

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
          console.error('Error completing quiz:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to complete quiz';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Reset quiz to initial state
      resetQuiz: () => {
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
          result: null
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
        const { currentQuestionIndex, questions } = get();
        const current = currentQuestionIndex + 1;
        const total = questions.length;
        const percentage = total > 0 ? (current / total) * 100 : 0;
        
        return { current, total, percentage };
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