import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Target, 
  Home, 
  RotateCcw, 
  BarChart3, 
  CheckCircle,
  Award,
  Star,
  BookOpen
} from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTime } from '@/lib/utils';
import '@/styles/quiz-interface.css';

interface ExamCompleteProps {
  onReturnHome: () => void;
  onRetryIncorrect?: () => void;
  onReviewAnswers?: () => void;
  onNewSession?: () => void;
}

export const ExamComplete: React.FC<ExamCompleteProps> = ({ 
  onReturnHome, 
  onRetryIncorrect, 
  onReviewAnswers,
  onNewSession 
}) => {
  const { user } = useAuthStore();
  const { 
    getProgress
  } = useQuizStore();

  const progress = getProgress();

  const totalQuestions = progress.total;
  const answeredQuestions = progress.current;
  const correctAnswers = progress.correct;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

  // Determine performance level
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: '#22c55e', icon: Trophy };
    if (accuracy >= 80) return { level: 'Very Good', color: '#22c55e', icon: Award };
    if (accuracy >= 70) return { level: 'Good', color: '#f59e0b', icon: Star };
    if (accuracy >= 60) return { level: 'Fair', color: '#f59e0b', icon: Target };
    return { level: 'Needs Improvement', color: '#ef4444', icon: BookOpen };
  };

  const performance = getPerformanceLevel(accuracy);
  const PerformanceIcon = performance.icon;

  // Show celebration animation for good performance
  useEffect(() => {
    if (accuracy >= 80) {
      // Could add confetti animation here
      console.log('Great performance!');
    }
  }, [accuracy]);

  return (
    <div className="quiz-container fade-in">
      {/* Celebration Header */}
      <div className="quiz-header" style={{ textAlign: 'center', position: 'relative' }}>
        <div>
          <h1 style={{ marginBottom: '16px' }}>🎉 Quiz Complete! 🎉</h1>
          <div className="quiz-meta">
            <div className="question-progress">
              Congratulations, {user?.displayName || user?.email?.split('@')[0]}!
            </div>
          </div>
        </div>
      </div>

      {/* Final Results Card */}
      <div className="question-card" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div className="question-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              padding: '16px',
              borderRadius: '50%',
              background: `${performance.color}20`,
              border: `3px solid ${performance.color}`
            }}>
              <PerformanceIcon className="w-8 h-8" style={{ color: performance.color }} />
            </div>
            <div>
              <h2 className="question-number" style={{ 
                fontSize: '3rem',
                color: performance.color,
                marginBottom: '8px'
              }}>
                {accuracy}%
              </h2>
              <div style={{ 
                fontSize: '1.4rem',
                fontWeight: '600',
                color: performance.color,
                marginBottom: '4px'
              }}>
                {performance.level}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px 0' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '24px',
            marginBottom: '30px'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0ea5e9' }}>
                {answeredQuestions}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Total Questions
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>
                {correctAnswers}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Correct Answers
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                {incorrectAnswers}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Incorrect
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                --
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Time Spent
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="action-buttons" style={{ marginTop: '40px' }}>
        <button onClick={onReturnHome} className="btn btn-primary">
          <Home className="w-5 h-5" />
          Return to Dashboard
        </button>

        {onNewSession && (
          <button onClick={onNewSession} className="btn btn-secondary">
            <Target className="w-5 h-5" />
            Start New Session
          </button>
        )}

        {incorrectAnswers > 0 && onRetryIncorrect && (
          <button onClick={onRetryIncorrect} className="btn btn-retry">
            <RotateCcw className="w-5 h-5" />
            📚 Master {incorrectAnswers} Question{incorrectAnswers !== 1 ? 's' : ''}
          </button>
        )}

        {onReviewAnswers && (
          <button onClick={onReviewAnswers} className="btn btn-secondary">
            <BarChart3 className="w-5 h-5" />
            Review All Answers
          </button>
        )}
      </div>

      {/* Motivational Message */}
      <div className="progress-section" style={{ marginTop: '30px' }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {accuracy >= 90 && (
            <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
              🌟 Outstanding performance! You've mastered this material! 🌟
            </p>
          )}
          {accuracy >= 80 && accuracy < 90 && (
            <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
              🎯 Great job! You're showing strong understanding of the concepts! 🎯
            </p>
          )}
          {accuracy >= 70 && accuracy < 80 && (
            <p style={{ color: '#f59e0b', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
              📚 Good work! Continue studying to improve your performance! 📚
            </p>
          )}
          {accuracy >= 60 && accuracy < 70 && (
            <p style={{ color: '#f59e0b', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
              💪 Keep practicing! You're making progress - don't give up! 💪
            </p>
          )}
          {accuracy < 60 && (
            <p style={{ color: '#ef4444', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
              📖 Consider reviewing the material and trying again. You've got this! 📖
            </p>
          )}
        </div>
      </div>

      {/* Final Summary */}
      <div className="feedback-section" style={{ 
        marginTop: '30px',
        background: '#f8fafc',
        border: `2px solid ${performance.color}`,
        borderLeft: `6px solid ${performance.color}`
      }}>
        <div className="feedback-result" style={{ 
          background: `${performance.color}20`,
          color: performance.color,
          border: `2px solid ${performance.color}`
        }}>
          <CheckCircle className="w-5 h-5" />
          Session Complete
        </div>
        <div className="feedback-content" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <strong>Questions Answered:</strong> {answeredQuestions} / {totalQuestions}
          </div>
          <div>
            <strong>Final Score:</strong> {accuracy}%
          </div>
          <div>
            <strong>Performance Level:</strong> {performance.level}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamComplete;