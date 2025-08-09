import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, BookOpen, Target } from 'lucide-react';

interface SectionStats {
  name: string;
  correct: number;
  total: number;
  percentage: number;
  avgTime?: number;
}

interface ProgressStats {
  totalCorrect: number;
  totalQuestions: number;
  avgTime: number;
  sectionProgress: Record<string, SectionStats>;
  incorrectQuestions: number;
  canRetryIncorrect: boolean;
}

interface ProgressViewProps {
  onReturnToQuiz?: () => void;
  onRetryIncorrect?: () => void;
  onStartNewSession?: () => void;
  currentQuestionId?: string;
  isRetryMode?: boolean;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  onReturnToQuiz,
  onRetryIncorrect,
  onStartNewSession,
  currentQuestionId,
  isRetryMode = false
}) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProgressStats>({
    totalCorrect: 0,
    totalQuestions: 0,
    avgTime: 0,
    sectionProgress: {},
    incorrectQuestions: 0,
    canRetryIncorrect: false
  });

  // Mock data - replace with real API call
  useEffect(() => {
    const mockStats: ProgressStats = {
      totalCorrect: 18,
      totalQuestions: 25,
      avgTime: 45.3,
      sectionProgress: {
        'Nutrition Science': {
          name: 'Nutrition Science',
          correct: 8,
          total: 10,
          percentage: 80,
          avgTime: 42.1
        },
        'Physical Activity': {
          name: 'Physical Activity',
          correct: 6,
          total: 8,
          percentage: 75,
          avgTime: 38.7
        },
        'Behavior Change': {
          name: 'Behavior Change',
          correct: 4,
          total: 7,
          percentage: 57.1,
          avgTime: 52.8
        }
      },
      incorrectQuestions: 7,
      canRetryIncorrect: true
    };
    setStats(mockStats);
  }, []);

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'progress-excellent';
    if (percentage >= 70) return 'progress-good';
    if (percentage >= 50) return 'progress-fair';
    return 'progress-needs-improvement';
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleReturnToMainSession = () => {
    if (onReturnToQuiz) {
      onReturnToQuiz();
    }
  };

  const handleRetryIncorrect = () => {
    if (onRetryIncorrect) {
      onRetryIncorrect();
    }
  };

  const handleStartNewSession = () => {
    if (onStartNewSession) {
      onStartNewSession();
    } else {
      navigate('/quiz');
    }
  };

  const overallPercentage = stats.totalQuestions > 0 
    ? (stats.totalCorrect / stats.totalQuestions * 100) 
    : 0;

  return (
    <div className="container">
      {/* Home Button Container */}
      <div className="home-button-container">
        <a href="#" onClick={(e) => { e.preventDefault(); handleReturnHome(); }} className="home-btn">
          Return to Home
        </a>
      </div>

      <div className="progress-container">
        <h2 className="progress-header">Session Progress</h2>

        {/* Overall Statistics */}
        <div className="overall-stats">
          <div className="stat-box stat-animate">
            <h3>Overall Score</h3>
            <div className="stat-value">{overallPercentage.toFixed(1)}%</div>
            <div className="stat-detail">
              {stats.totalCorrect} correct out of {stats.totalQuestions}
            </div>
          </div>

          <div className="stat-box stat-animate">
            <h3>Session Progress</h3>
            <div className="stat-value">{stats.totalQuestions} / 100</div>
            <div className="stat-detail">Questions attempted</div>
          </div>

          <div className="stat-box stat-animate">
            <h3>Average Time</h3>
            <div className="stat-value">{stats.avgTime.toFixed(1)}</div>
            <div className="stat-detail">seconds per question</div>
          </div>
        </div>

        {/* Section Progress */}
        {Object.keys(stats.sectionProgress).length > 0 && (
          <div className="section-progress">
            <h3 className="section-header">Performance by Section</h3>
            
            {Object.values(stats.sectionProgress).map((section, index) => (
              <div key={section.name} className="section-box">
                <h4>
                  {section.name} 
                  <span className="section-percentage">{section.percentage.toFixed(1)}%</span>
                </h4>
                
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getProgressBarColor(section.percentage)}`}
                    style={{ 
                      width: `${section.percentage}%`,
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <span className="progress-label">{section.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="section-details">
                  <div className="detail-item">
                    <span className="detail-label">Questions:</span>
                    <span className="detail-value">{section.correct}/{section.total} correct</span>
                  </div>
                  {section.avgTime && (
                    <div className="detail-item">
                      <span className="detail-label">Average Time:</span>
                      <span className="detail-value">{section.avgTime.toFixed(1)} seconds</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Options */}
        <div className="progress-navigation">
          <div className="nav-group">
            {isRetryMode ? (
              <button onClick={handleReturnToMainSession} className="nav-btn return-btn">
                <Home className="w-4 h-4 mr-2" />
                Return to Main Session
              </button>
            ) : currentQuestionId ? (
              <button onClick={onReturnToQuiz} className="nav-btn">
                <Target className="w-4 h-4 mr-2" />
                Return to Current Question
              </button>
            ) : (
              <button onClick={handleStartNewSession} className="nav-btn">
                <BookOpen className="w-4 h-4 mr-2" />
                Start New Session
              </button>
            )}
          </div>
          
          <div className="nav-group">
            {stats.totalQuestions > 0 && (
              <>
                <button onClick={() => navigate('/incorrect-answers')} className="nav-btn">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Review Incorrect Answers
                </button>
                {stats.incorrectQuestions > 0 && stats.canRetryIncorrect && (
                  <button onClick={handleRetryIncorrect} className="nav-btn retry-btn">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry {stats.incorrectQuestions} Incorrect Questions
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;