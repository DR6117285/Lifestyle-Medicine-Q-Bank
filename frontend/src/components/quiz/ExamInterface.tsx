import React, { useEffect, useState } from 'react';
import { Clock, Skip, Eye, CheckCircle } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface ExamQuestion {
  id: string;
  question_text: string;
  options: { option_key: string; option_text: string; }[];
  section?: string;
  question_type?: string;
}

interface ExamInterfaceProps {
  onComplete: () => void;
  onExit: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({ onComplete, onExit }) => {
  // Mock exam data - replace with real store/API calls
  const [currentQuestion] = useState<ExamQuestion>({
    id: '1',
    question_text: 'Which of the following is the most effective intervention for reducing cardiovascular risk in patients with metabolic syndrome?',
    options: [
      { option_key: 'A', option_text: 'Intensive lifestyle modification including diet and exercise' },
      { option_key: 'B', option_text: 'Pharmacological intervention with statins alone' },
      { option_key: 'C', option_text: 'Bariatric surgery' },
      { option_key: 'D', option_text: 'Stress management techniques only' }
    ],
    section: 'Cardiovascular Health',
    question_type: 'Multiple Choice'
  });

  const [currentNumber] = useState(1);
  const [totalQuestions] = useState(50);
  const [timeRemaining, setTimeRemaining] = useState(2700); // 45 minutes in seconds
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [skippedQuestions] = useState<string[]>(['2', '5']); // Mock skipped questions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          // Auto-submit exam when time runs out
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeUp = () => {
    alert('Time is up! The exam will be submitted automatically.');
    onComplete();
  };

  const handleOptionSelect = (optionKey: string) => {
    setSelectedOption(optionKey);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption) {
      alert('Please select an answer before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Mock API call - replace with real submission
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to next question or complete exam
      console.log(`Submitted answer: ${selectedOption} for question ${currentQuestion.id}`);
      
      // This would normally be handled by navigation logic
      // For now, just log the action
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = () => {
    // Add current question to skipped list
    console.log(`Skipped question ${currentQuestion.id}`);
    // Navigate to next question
  };

  const handleReviewSkipped = () => {
    // Navigate to skipped questions review
    console.log('Navigating to review skipped questions');
  };

  const getTimeRemainingColor = () => {
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 600) return 'text-yellow-600'; // Less than 10 minutes
    return 'text-green-600';
  };

  return (
    <div className="container">
      {/* Exam Header */}
      <div className="exam-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'var(--background-light)',
        borderRadius: 'var(--border-radius-sm)'
      }}>
        <div className="exam-progress">
          Question {currentNumber} / {totalQuestions}
        </div>
        <div className={`time-remaining flex items-center space-x-2 ${getTimeRemainingColor()}`}>
          <Clock className="h-5 w-5" />
          <span className="font-mono font-bold text-lg">
            Time Remaining: {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="question">
        {currentQuestion.question_text}
      </div>

      {/* Options Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }}>
        <div className="options">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option.option_key;
            
            return (
              <div
                key={option.option_key}
                className={`option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.option_key)}
              >
                <input 
                  type="radio" 
                  name="selected_option" 
                  value={option.option_key}
                  id={`option${option.option_key}`}
                  checked={isSelected}
                  onChange={() => {}}
                />
                <label htmlFor={`option${option.option_key}`}>
                  {option.option_text}
                </label>
              </div>
            );
          })}
        </div>

        {/* Exam Actions */}
        <div className="exam-actions" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          margin: '30px 0',
          flexWrap: 'wrap'
        }}>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!selectedOption || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Submit Answer</span>
              </div>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleSkipQuestion}
            className="nav-btn"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Skip className="h-4 w-4 mr-2" />
            Skip Question
          </button>
          
          {skippedQuestions.length > 0 && (
            <button 
              type="button"
              onClick={handleReviewSkipped}
              className="nav-btn"
              style={{ backgroundColor: 'var(--secondary-color)' }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Review Skipped ({skippedQuestions.length})
            </button>
          )}
        </div>
      </form>

      {/* Exam Progress Indicator */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: 'var(--background-light)',
        borderRadius: 'var(--border-radius-sm)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Exam Progress
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: `${(currentNumber / totalQuestions) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--primary-color)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <div style={{ 
          marginTop: '5px', 
          fontSize: '12px', 
          color: 'var(--text-muted)' 
        }}>
          {currentNumber} of {totalQuestions} questions completed
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;