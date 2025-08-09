import React, { useState } from 'react';
import { CheckSquare, Square, Play } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  weight?: number;
  questionCount?: number;
}

interface QuizPreferencesProps {
  sections: Section[];
  questionTypes: string[];
  onStartQuiz: (preferences: {
    selectedSections: string[];
    selectedTypes: string[];
    mode: 'random' | 'section' | 'timed';
  }) => void;
}

export const QuizPreferences: React.FC<QuizPreferencesProps> = ({
  sections,
  questionTypes,
  onStartQuiz,
}) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [quizMode, setQuizMode] = useState<'random' | 'section' | 'timed'>('random');

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(sections.map(s => s.id));
  };

  const deselectAllSections = () => {
    setSelectedSections([]);
  };

  const selectAllTypes = () => {
    setSelectedTypes([...questionTypes]);
  };

  const deselectAllTypes = () => {
    setSelectedTypes([]);
  };

  const handleStartQuiz = () => {
    onStartQuiz({
      selectedSections,
      selectedTypes,
      mode: quizMode,
    });
  };

  const canStart = selectedSections.length > 0 && selectedTypes.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-light)' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="header">
          <h1 style={{ color: 'var(--primary-color)' }}>
            Lifestyle Medicine Question Bank
          </h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            Select your practice preferences
          </p>
        </div>

        <form className="preferences-form">
          {/* Quiz Mode Selection */}
          <div className="section-select">
            <h2 style={{ color: 'var(--primary-color)' }}>Quiz Mode</h2>
            <div className="space-y-3">
              {[
                { id: 'random', label: 'Random Practice', desc: 'Mixed questions from selected sections' },
                { id: 'section', label: 'Section Practice', desc: 'Focus on specific sections in order' },
                { id: 'timed', label: 'Timed Quiz', desc: 'Simulate exam conditions with timer' },
              ].map((mode) => (
                <div key={mode.id} className="checkbox-group">
                  <input
                    type="radio"
                    id={`mode-${mode.id}`}
                    name="quizMode"
                    value={mode.id}
                    checked={quizMode === mode.id}
                    onChange={(e) => setQuizMode(e.target.value as any)}
                  />
                  <label htmlFor={`mode-${mode.id}`} className="flex-1">
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {mode.desc}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Section Selection */}
          <div className="section-select">
            <h2 style={{ color: 'var(--primary-color)' }}>Select Sections</h2>
            <div className="select-controls">
              <button type="button" onClick={selectAllSections} className="control-btn">
                Select All
              </button>
              <button type="button" onClick={deselectAllSections} className="control-btn">
                Deselect All
              </button>
            </div>
            
            {sections.map((section) => (
              <div key={section.id} className="checkbox-group">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSectionToggle(section.id)}
                >
                  {selectedSections.includes(section.id) ? (
                    <CheckSquare 
                      className="w-5 h-5 mr-3" 
                      style={{ color: 'var(--primary-color)' }} 
                    />
                  ) : (
                    <Square className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} />
                  )}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedSections.includes(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                  />
                  <label className="flex-1 cursor-pointer">
                    <div className="font-medium">{section.name}</div>
                    {section.weight && (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Weight: {section.weight}%
                      </div>
                    )}
                    {section.questionCount && (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {section.questionCount} questions available
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
            
            {selectedSections.length > 0 && (
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--background-light)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--primary-color)' }}>
                  Selected: {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Question Type Selection */}
          <div className="type-select">
            <h2 style={{ color: 'var(--primary-color)' }}>Select Question Types</h2>
            <div className="select-controls">
              <button type="button" onClick={selectAllTypes} className="control-btn">
                Select All
              </button>
              <button type="button" onClick={deselectAllTypes} className="control-btn">
                Deselect All
              </button>
            </div>
            
            {questionTypes.map((type) => (
              <div key={type} className="checkbox-group">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleTypeToggle(type)}
                >
                  {selectedTypes.includes(type) ? (
                    <CheckSquare 
                      className="w-5 h-5 mr-3" 
                      style={{ color: 'var(--primary-color)' }} 
                    />
                  ) : (
                    <Square className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} />
                  )}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                  />
                  <label className="flex-1 cursor-pointer">{type}</label>
                </div>
              </div>
            ))}
            
            {selectedTypes.length > 0 && (
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--background-light)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--primary-color)' }}>
                  Selected: {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <div className="start-container">
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={!canStart}
              className="start-btn"
              style={{
                opacity: canStart ? 1 : 0.5,
                cursor: canStart ? 'pointer' : 'not-allowed',
                backgroundColor: canStart ? 'var(--primary-color)' : '#ccc'
              }}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Practice Session
            </button>
            
            {!canStart && (
              <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Please select at least one section and one question type to continue
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};