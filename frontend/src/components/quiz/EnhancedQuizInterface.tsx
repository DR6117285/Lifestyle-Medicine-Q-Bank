import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Home, ArrowLeft, ArrowRight, BarChart } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  rationale?: string;
  section: string;
  options: string[];
}

interface QuizInterfaceProps {
  question: QuizQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string, timeSpent: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onHome: () => void;
  feedback?: {
    isCorrect: boolean;
    correctAnswer: string;
    rationale?: string;
    showFeedback: boolean;
  };
  hasNext: boolean;
  hasPrevious: boolean;
  correctCount: number;
  timeStarted: number;
}

export const EnhancedQuizInterface: React.FC<QuizInterfaceProps> = ({
  question,
  currentQuestionNumber,
  totalQuestions,
  onSubmit,
  onNext,
  onPrevious,
  onHome,
  feedback,
  hasNext,
  hasPrevious,
  correctCount,
  timeStarted,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const navigate = useNavigate();

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setIsSubmitted(false);
    setQuestionStartTime(Date.now());
  }, [question.id]);

  const handleOptionClick = (option: string) => {
    if (!isSubmitted && !feedback?.showFeedback) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer && !isSubmitted) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      setIsSubmitted(true);
      onSubmit(selectedAnswer, timeSpent);
    }
  };

  const getOptionClass = (option: string) => {
    let classes = 'option cursor-pointer transition-colors';
    
    if (selectedAnswer === option) {
      classes += ' selected bg-blue-50 border-blue-300';
    }
    
    if (feedback?.showFeedback) {
      if (option === feedback.correctAnswer) {
        classes += ' correct border-green-500 bg-green-50';
      } else if (option === selectedAnswer && !feedback.isCorrect) {
        classes += ' incorrect border-red-500 bg-red-50';
      }
    }
    
    return classes;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-light)' }}>
      {/* Header with Home Button */}
      <div className="home-button-container">
        <button onClick={onHome} className="home-btn">
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Question Header */}
        <div className="question-header">
          <h1 style={{ color: 'var(--primary-color)' }}>
            Question {currentQuestionNumber}
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Section: {question.section}</span>
            <Clock className="w-4 h-4" />
            <span>Started: {Math.floor((Date.now() - timeStarted) / 1000 / 60)} min ago</span>
          </div>
        </div>

        {/* Question Text */}
        <div className="question">
          {question.question_text}
        </div>

        {/* Options */}
        <div className="options">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={getOptionClass(option)}
              onClick={() => handleOptionClick(option)}
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: 'var(--border-radius-sm)',
                padding: '12px 16px',
                marginBottom: '10px',
                cursor: feedback?.showFeedback ? 'default' : 'pointer'
              }}
            >
              <input
                type="radio"
                name="selected_option"
                value={option}
                checked={selectedAnswer === option}
                onChange={() => handleOptionClick(option)}
                disabled={feedback?.showFeedback}
                className="mr-3"
              />
              <label className="cursor-pointer flex-1">{option}</label>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!feedback?.showFeedback && !isSubmitted && (
          <div className="submit-container">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="submit-btn"
              style={{
                opacity: selectedAnswer ? 1 : 0.5,
                cursor: selectedAnswer ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* Feedback Section */}
        {feedback?.showFeedback && (
          <div className="feedback">
            <div className={`feedback-result ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            <p><strong>Correct Answer:</strong> {feedback.correctAnswer}</p>
            {feedback.rationale && (
              <p><strong>Rationale:</strong> {feedback.rationale}</p>
            )}
            <p><strong>Section:</strong> {question.section}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="navigation">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="nav-btn"
            style={{ opacity: hasPrevious ? 1 : 0.5 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="nav-btn"
            style={{ opacity: hasNext ? 1 : 0.5 }}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Progress Counter */}
        <div className="progress-counter">
          <button 
            onClick={() => navigate('/statistics')}
            className="nav-btn mb-4"
          >
            <BarChart className="w-4 h-4 mr-2" />
            View Progress
          </button>
          <p>Correct answers: {correctCount} / {currentQuestionNumber}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                  backgroundColor: 'var(--primary-color)'
                }}
              />
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Progress: {Math.round((currentQuestionNumber / totalQuestions) * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};