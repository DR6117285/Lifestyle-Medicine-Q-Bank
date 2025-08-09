import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, BookOpen, Home, Download } from 'lucide-react';

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeSpent: number; // in seconds
  passingScore: number;
  scorePercentage: number;
  isPassed: boolean;
  sectionBreakdown: {
    [section: string]: {
      total: number;
      correct: number;
      percentage: number;
    };
  };
}

interface ExamCompleteProps {
  examResult?: ExamResult;
  onReturnHome: () => void;
  onStartNewExam: () => void;
  onReviewAnswers: () => void;
}

export const ExamComplete: React.FC<ExamCompleteProps> = ({
  examResult,
  onReturnHome,
  onStartNewExam,
  onReviewAnswers
}) => {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);

  // Mock exam result data
  const [result] = useState<ExamResult>(examResult || {
    totalQuestions: 50,
    correctAnswers: 38,
    incorrectAnswers: 10,
    skippedQuestions: 2,
    timeSpent: 2580, // 43 minutes
    passingScore: 70,
    scorePercentage: 76,
    isPassed: true,
    sectionBreakdown: {
      'Nutrition Science': { total: 15, correct: 12, percentage: 80 },
      'Physical Activity': { total: 10, correct: 8, percentage: 80 },
      'Behavior Change': { total: 12, correct: 9, percentage: 75 },
      'Mental Health': { total: 8, correct: 6, percentage: 75 },
      'Sleep Medicine': { total: 5, correct: 3, percentage: 60 }
    }
  });

  // Animate score percentage
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev >= result.scorePercentage) {
          clearInterval(timer);
          return result.scorePercentage;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [result.scorePercentage]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (result.scorePercentage >= 90) return 'var(--primary-color)';
    if (result.scorePercentage >= result.passingScore) return '#4CAF50';
    return 'var(--error-color)';
  };

  const getSectionBarColor = (percentage: number) => {
    if (percentage >= 90) return 'progress-excellent';
    if (percentage >= 70) return 'progress-good';
    if (percentage >= 50) return 'progress-fair';
    return 'progress-needs-improvement';
  };

  const handleDownloadResults = () => {
    // Generate and download exam results as PDF or CSV
    console.log('Downloading exam results...');
    // This would trigger a download
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1 style={{ 
          color: result.isPassed ? 'var(--primary-color)' : 'var(--error-color)' 
        }}>
          Exam Complete!
        </h1>
        <p className="subtitle">
          {result.isPassed ? 'Congratulations! You have passed the exam.' : 'You did not meet the passing score this time.'}
        </p>
      </div>

      {/* Overall Results */}
      <div className="overall-stats">
        <div className="stat-box stat-animate">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Trophy className="h-8 w-8" style={{ color: getScoreColor(), marginRight: '10px' }} />
            <h3>Final Score</h3>
          </div>
          <div className="stat-value" style={{ 
            color: getScoreColor(),
            fontSize: '3rem',
            fontWeight: 'bold'
          }}>
            {animatedScore}%
          </div>
          <div className="stat-detail">
            {result.correctAnswers} out of {result.totalQuestions} correct
          </div>
          <div className="stat-detail" style={{ 
            color: result.isPassed ? 'var(--primary-color)' : 'var(--error-color)',
            fontWeight: 'bold',
            marginTop: '5px'
          }}>
            {result.isPassed ? 'PASSED' : 'FAILED'} (Passing: {result.passingScore}%)
          </div>
        </div>

        <div className="stat-box stat-animate">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Clock className="h-6 w-6" style={{ color: 'var(--secondary-color)', marginRight: '10px' }} />
            <h3>Time Spent</h3>
          </div>
          <div className="stat-value" style={{ color: 'var(--secondary-color)' }}>
            {formatTime(result.timeSpent)}
          </div>
          <div className="stat-detail">Total exam time</div>
        </div>

        <div className="stat-box stat-animate">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Target className="h-6 w-6" style={{ color: 'var(--accent-color)', marginRight: '10px' }} />
            <h3>Accuracy</h3>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-color)' }}>
            {((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)}%
          </div>
          <div className="stat-detail">
            {result.incorrectAnswers} incorrect, {result.skippedQuestions} skipped
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="section-progress">
        <h3 className="section-header">Performance by Section</h3>
        
        {Object.entries(result.sectionBreakdown).map(([sectionName, sectionData], index) => (
          <div key={sectionName} className="section-box">
            <h4>
              {sectionName}
              <span className="section-percentage">{sectionData.percentage.toFixed(1)}%</span>
            </h4>
            
            <div className="progress-bar">
              <div 
                className={`progress-fill ${getSectionBarColor(sectionData.percentage)}`}
                style={{ 
                  width: `${sectionData.percentage}%`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <span className="progress-label">{sectionData.percentage.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="section-details">
              <div className="detail-item">
                <span className="detail-label">Questions:</span>
                <span className="detail-value">{sectionData.correct}/{sectionData.total} correct</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="progress-navigation">
        <div className="nav-group">
          <button onClick={onReturnHome} className="nav-btn">
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </button>
          
          <button onClick={onReviewAnswers} className="nav-btn">
            <BookOpen className="w-4 h-4 mr-2" />
            Review All Answers
          </button>
        </div>
        
        <div className="nav-group">
          <button onClick={handleDownloadResults} className="nav-btn">
            <Download className="w-4 h-4 mr-2" />
            Download Results
          </button>
          
          <button onClick={onStartNewExam} className="start-btn">
            Take Another Exam
          </button>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'var(--background-light)',
        borderRadius: 'var(--border-radius-sm)',
        textAlign: 'center'
      }}>
        <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>
          Next Steps
        </h4>
        {result.isPassed ? (
          <p style={{ color: 'var(--text-color)', lineHeight: '1.6' }}>
            Excellent work! You've demonstrated solid knowledge in lifestyle medicine. 
            Continue practicing to maintain and improve your expertise.
          </p>
        ) : (
          <p style={{ color: 'var(--text-color)', lineHeight: '1.6' }}>
            Don't be discouraged! Review the areas where you scored lower and take 
            another practice exam when you're ready. Focus especially on sections 
            where you scored below 70%.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamComplete;