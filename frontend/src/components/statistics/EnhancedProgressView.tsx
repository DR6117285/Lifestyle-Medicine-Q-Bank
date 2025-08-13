import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Play, RotateCcw, Clock, Target } from 'lucide-react';

interface SectionStats {
  name: string;
  correct: number;
  total: number;
  percentage: number;
  avgTime?: number;
}

interface ProgressViewProps {
  totalCorrect: number;
  totalQuestions: number;
  averageTime: number;
  sectionProgress: SectionStats[];
  onReturnHome: () => void;
  onContinueSession?: () => void;
  onRetryIncorrect?: () => void;
  hasIncorrect?: boolean;
}

export const EnhancedProgressView: React.FC<ProgressViewProps> = ({
  totalCorrect,
  totalQuestions,
  averageTime,
  sectionProgress,
  onReturnHome,
  onContinueSession,
  onRetryIncorrect,
  hasIncorrect = false,
}) => {
  const [animatedBars, setAnimatedBars] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger bar animations after component mounts
    const timer = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getProgressBarClass = (percentage: number) => {
    if (percentage >= 90) return 'progress-excellent';
    if (percentage >= 70) return 'progress-good';
    if (percentage >= 50) return 'progress-fair';
    return 'progress-needs-improvement';
  };

  const getPerformanceText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-light)' }}>
      {/* Header with Home Button */}
      <div className="home-button-container">
        <button onClick={onReturnHome} className="home-btn">
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </button>
      </div>

      <div className="progress-container max-w-6xl mx-auto p-6">
        <h2 className="progress-header">Session Progress</h2>

        {/* Overall Stats */}
        <div className="overall-stats">
          <div className="stat-box stat-animate">
            <h3>Overall Score</h3>
            <div className="stat-value" style={{ color: 'var(--primary-color)' }}>
              {overallPercentage.toFixed(1)}%
            </div>
            <div className="stat-detail" style={{ color: '#475569', fontWeight: '600' }}>
              {totalCorrect} correct out of {totalQuestions}
            </div>
            <div className="mt-2 text-sm font-bold" style={{ 
              color: overallPercentage >= 70 ? '#0f766e' : '#ef4444' 
            }}>
              {getPerformanceText(overallPercentage)}
            </div>
          </div>

          <div className="stat-box stat-animate">
            <h3>Session Progress</h3>
            <div className="stat-value" style={{ color: 'var(--secondary-color)' }}>
              {totalQuestions}
            </div>
            <div className="stat-detail" style={{ color: '#475569', fontWeight: '600' }}>
              Questions attempted
            </div>
          </div>

          <div className="stat-box stat-animate">
            <h3>Average Time</h3>
            <div className="stat-value" style={{ color: 'var(--accent-color)' }}>
              {averageTime.toFixed(1)}s
            </div>
            <div className="stat-detail" style={{ color: '#475569', fontWeight: '600' }}>
              seconds per question
            </div>
          </div>
        </div>

        {/* Section Progress */}
        <div className="section-progress">
          <h3 className="section-header">Performance by Section</h3>
          
          {sectionProgress.map((section, index) => (
            <div key={section.name} className="section-box">
              <h4 className="flex justify-between items-center mb-3">
                <span style={{ color: '#0f766e', fontWeight: '700' }}>{section.name}</span>
                <span className="section-percentage font-bold" style={{ color: '#0ea5e9' }}>
                  {section.percentage.toFixed(1)}%
                </span>
              </h4>
              
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getProgressBarClass(section.percentage)}`}
                  style={{
                    width: animatedBars ? `${section.percentage}%` : '0%',
                    transition: 'width 1s ease-out',
                    transitionDelay: `${index * 0.1}s`
                  }}
                >
                  <span className="progress-label">
                    {section.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="section-details">
                <div className="detail-item">
                  <span className="detail-label">Questions:</span>
                  <span className="detail-value">
                    {section.correct}/{section.total} correct
                  </span>
                </div>
                {section.avgTime && (
                  <div className="detail-item">
                    <span className="detail-label">Average Time:</span>
                    <span className="detail-value">
                      {section.avgTime.toFixed(1)} seconds
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Performance:</span>
                  <span className="detail-value" style={{
                    color: section.percentage >= 70 ? '#0f766e' : '#ef4444',
                    fontWeight: '700'
                  }}>
                    {getPerformanceText(section.percentage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Actions */}
        <div className="progress-navigation">
          <div className="flex flex-wrap gap-4 justify-center">
            {onContinueSession && (
              <button onClick={onContinueSession} className="btn btn-primary">
                <Play className="w-4 h-4 mr-2" />
                Continue Session
              </button>
            )}
            
            {hasIncorrect && onRetryIncorrect && (
              <button onClick={onRetryIncorrect} className="btn btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Incorrect Questions
              </button>
            )}
            
            <button 
              onClick={() => navigate('/quiz')} 
              className="btn btn-outline"
            >
              <Target className="w-4 h-4 mr-2" />
              Start New Quiz
            </button>

            <button 
              onClick={() => navigate('/statistics')} 
              className="btn btn-outline"
            >
              <Clock className="w-4 h-4 mr-2" />
              Detailed Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};