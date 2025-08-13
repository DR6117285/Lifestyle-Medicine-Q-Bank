import React, { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Home, 
  RotateCcw,
  BookOpen,
  Trophy
} from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTime } from '@/lib/utils';
import { RetryView } from './RetryView';
import '@/styles/quiz-interface.css';

interface ProgressViewProps {
  onReturn: () => void;
  onReturnHome: () => void;
  onRetryIncorrect?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ 
  onReturn, 
  onReturnHome, 
  onRetryIncorrect 
}) => {
  const { user } = useAuthStore();
  const [showRetryView, setShowRetryView] = useState(false);
  
  const { 
    getProgress,
    questions,
    answers,
    timeRemaining,
    getIncorrectQuestions
  } = useQuizStore();

  const progress = getProgress();
  const incorrectQuestions = getIncorrectQuestions();
  
  const totalQuestions = progress.total;
  const answeredQuestions = answers.size; // Number of questions answered
  const correctAnswers = progress.correct;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const accuracy = Math.round(progress.accuracy) || 0;
  const averageTime = 45; // Placeholder for now
  const sectionStats = {}; // Empty for now, will implement later

  // Show retry view if requested
  if (showRetryView) {
    return (
      <RetryView 
        onStartRetry={() => {
          setShowRetryView(false);
          onReturn(); // Return to quiz with retry questions
        }}
        onReturn={() => setShowRetryView(false)}
        onReturnHome={onReturnHome}
      />
    );
  }

  return (
    <div className="quiz-container fade-in">
      {/* Header */}
      <div className="quiz-header">
        <h1>Session Progress</h1>
        <div className="quiz-meta">
          <div className="question-progress">
            Welcome back, {user?.displayName || user?.email?.split('@')[0]}
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="question-card">
        <div className="question-header">
          <h2 className="question-number">Overall Performance</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="feedback-section" style={{ border: '2px solid #22c55e', borderLeft: '6px solid #22c55e' }}>
            <div className="feedback-result correct">
              <Trophy className="w-5 h-5" />
              Overall Score
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#22c55e', margin: 0 }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600', marginTop: '8px' }}>
                {correctAnswers} correct out of {answeredQuestions}
              </div>
            </div>
          </div>

          <div className="feedback-section" style={{ border: '2px solid #0ea5e9', borderLeft: '6px solid #0ea5e9' }}>
            <div className="feedback-result" style={{ background: '#eff6ff', color: '#0ea5e9', border: '2px solid #0ea5e9' }}>
              <Target className="w-5 h-5" />
              Session Progress
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0ea5e9', margin: 0 }}>
                {answeredQuestions}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px' }}>
                of {totalQuestions} questions attempted
              </div>
            </div>
          </div>

          <div className="feedback-section" style={{ border: '2px solid #475569', borderLeft: '6px solid #475569' }}>
            <div className="feedback-result" style={{ background: '#f1f5f9', color: '#475569', border: '2px solid #475569' }}>
              <Clock className="w-5 h-5" />
              Average Time
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#475569', margin: 0 }}>
                {averageTime.toFixed(1)}s
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px' }}>
                seconds per question
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Performance */}
      {sectionStats && Object.keys(sectionStats).length > 0 && (
        <div className="question-card">
          <div className="question-header">
            <h2 className="question-number">Performance by Section</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {Object.entries(sectionStats).map(([section, stats]) => (
              <div key={section} className="option-item" style={{ cursor: 'default', padding: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '1.2rem', 
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      {section}
                      <span style={{ 
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: stats.percentage >= 80 ? '#22c55e' : stats.percentage >= 70 ? '#475569' : '#ef4444',
                        marginLeft: '12px'
                      }}>
                        {stats.percentage.toFixed(1)}%
                      </span>
                    </h4>
                  </div>
                  
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: '#e2e8f0', 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${stats.percentage}%`,
                      background: stats.percentage >= 80 ? '#22c55e' : stats.percentage >= 70 ? '#475569' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>
                    <span>
                      <strong>Questions:</strong> {stats.correct}/{stats.total} correct
                    </span>
                    {stats.avgTime && (
                      <span>
                        <strong>Avg Time:</strong> {stats.avgTime.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="navigation-section">
        <div className="nav-buttons">
          <button onClick={onReturnHome} className="nav-btn">
            <Home className="w-4 h-4" />
            Return to Home
          </button>
          
          <button onClick={onReturn} className="nav-btn primary">
            <BookOpen className="w-4 h-4" />
            Continue Session
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {incorrectAnswers > 0 && (
          <button onClick={() => setShowRetryView(true)} className="btn btn-outline">
            <RotateCcw className="w-4 h-4" />
            Retry {incorrectAnswers} Incorrect Questions
          </button>
        )}
        
        <button 
          onClick={() => {
            // Could implement review functionality
            alert('Review functionality coming soon!');
          }} 
          className="btn btn-secondary"
        >
          <BarChart3 className="w-4 h-4" />
          Review All Answers
        </button>
      </div>

      {/* Progress Summary */}
      <div className="progress-section">
        <p className="progress-text">
          <CheckCircle className="w-4 h-4 inline" style={{ color: '#22c55e', marginRight: '8px' }} />
          {correctAnswers} Correct
          <XCircle className="w-4 h-4 inline" style={{ color: '#ef4444', marginLeft: '16px', marginRight: '8px' }} />
          {incorrectAnswers} Incorrect
          <TrendingUp className="w-4 h-4 inline" style={{ color: '#0ea5e9', marginLeft: '16px', marginRight: '8px' }} />
          {accuracy}% Accuracy
        </p>
      </div>
    </div>
  );
};

export default ProgressView;