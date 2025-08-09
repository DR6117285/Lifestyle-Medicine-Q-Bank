import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  Home, 
  BookOpen,
  ArrowLeft 
} from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import '@/styles/quiz-interface.css';

interface RetryViewProps {
  onStartRetry: () => void;
  onReturn: () => void;
  onReturnHome: () => void;
}

export const RetryView: React.FC<RetryViewProps> = ({ 
  onStartRetry, 
  onReturn,
  onReturnHome 
}) => {
  const { user } = useAuthStore();
  const { getIncorrectQuestions, startRetrySession } = useQuizStore();

  const incorrectQuestions = getIncorrectQuestions();

  const handleStartRetry = () => {
    startRetrySession();
    onStartRetry();
  };

  if (incorrectQuestions.length === 0) {
    return (
      <div className="quiz-container fade-in">
        <div className="question-card">
          <div className="question-header">
            <h2 className="question-number">No Questions to Retry</h2>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <h3 style={{ color: '#22c55e', marginBottom: '16px' }}>
              Great Job!
            </h3>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>
              You answered all questions correctly. There are no incorrect questions to retry.
            </p>
            
            <div className="action-buttons">
              <button onClick={onReturn} className="btn btn-outline">
                <ArrowLeft className="w-4 h-4" />
                Back to Progress
              </button>
              <button onClick={onReturnHome} className="btn btn-primary">
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container fade-in">
      {/* Flow Breadcrumb */}
      <div className="flow-breadcrumb">
        <div className="breadcrumb-item completed">
          <CheckCircle className="w-4 h-4" />
          Quiz Complete
        </div>
        <span className="breadcrumb-arrow">→</span>
        <div className="breadcrumb-item active">
          <RotateCcw className="w-4 h-4" />
          Review Questions
        </div>
        <span className="breadcrumb-arrow">→</span>
        <div className="breadcrumb-item pending">
          <AlertCircle className="w-4 h-4" />
          Retry Session
        </div>
      </div>

      {/* Header */}
      <div className="quiz-header">
        <h1>
          <span className="retry-mode-indicator">
            <RotateCcw className="w-4 h-4" />
            Retry Mode
          </span>
          Review Incorrect Questions
        </h1>
        <div className="quiz-meta">
          <div className="question-progress">
            {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? 's' : ''} need your attention
          </div>
        </div>
      </div>

      {/* Retry Progress Context */}
      <div className="retry-progress-context">
        <div className="retry-stats">
          <div className="retry-stat-item">
            <div className="retry-stat-value">{incorrectQuestions.length}</div>
            <div className="retry-stat-label">To Retry</div>
          </div>
          <div className="retry-stat-item">
            <div className="retry-stat-value">{Math.round((incorrectQuestions.length / (incorrectQuestions.length + (getIncorrectQuestions().length === 0 ? 1 : 0))) * 100)}%</div>
            <div className="retry-stat-label">Focus Area</div>
          </div>
          <div className="retry-stat-item">
            <div className="retry-stat-value">~{incorrectQuestions.length * 2}</div>
            <div className="retry-stat-label">Est. Minutes</div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="question-card">
        <div className="question-header">
          <h2 className="question-number">Review Before Retry</h2>
        </div>
        
        <div className="feedback-section" style={{ border: '2px solid #f59e0b', borderLeft: '6px solid #f59e0b', marginBottom: '30px' }}>
          <div className="feedback-result" style={{ background: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
            <AlertCircle className="w-5 h-5" />
            Ready to Retry
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>
              You have <strong>{incorrectQuestions.length} incorrect question{incorrectQuestions.length !== 1 ? 's' : ''}</strong> to retry.
            </p>
            <p style={{ margin: 0, color: '#64748b' }}>
              You'll go through only these questions again. Take your time to read carefully and choose the best answer.
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="retry-motivation">
          <p className="retry-motivation-text">
            📚 Let's master these concepts together! Each retry is a step closer to excellence.
          </p>
        </div>

        {/* Questions List */}
        <div className="retry-questions-list">
          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BookOpen className="w-6 h-6" />
            Questions Requiring Your Attention:
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {incorrectQuestions.map((question, index) => {
              // Simulate difficulty level (you can replace this with actual data)
              const getDifficulty = () => {
                const textLength = question.question_text.length;
                if (textLength > 200) return 'hard';
                if (textLength > 100) return 'medium';
                return 'easy';
              };
              
              const difficulty = getDifficulty();
              
              return (
                <div key={question.id} className="retry-question-item">
                  <div className="retry-question-number">
                    {index + 1}
                  </div>
                  <div className="retry-question-content">
                    <div className={`retry-question-difficulty difficulty-${difficulty}`}>
                      {difficulty}
                    </div>
                    <p className="retry-question-text">
                      {question.question_text}
                    </p>
                    
                    {question.section && (
                      <div style={{ 
                        marginBottom: '8px',
                        fontSize: '0.85rem',
                        color: '#64748b',
                        fontWeight: '600'
                      }}>
                        📖 Section: {question.section}
                      </div>
                    )}
                    
                    {question.rationale && (
                      <div className="retry-question-hint">
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.95rem', 
                          color: '#0c4a6e',
                          fontWeight: '500'
                        }}>
                          <strong>💡 Study Hint:</strong> {question.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={onReturn} className="btn btn-outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Progress
          </button>
          <button onClick={handleStartRetry} className="btn btn-retry">
            <RotateCcw className="w-5 h-5" />
            Begin Focused Review
          </button>
        </div>
      </div>
    </div>
  );
};