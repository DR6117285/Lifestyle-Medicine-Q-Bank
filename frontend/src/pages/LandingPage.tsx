import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuizStore } from '@/stores/quizStore';

interface Section {
  id: number;
  name: string;
  weight: number;
}

interface QuestionType {
  id: number;
  name: string;
}

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { initializeQuiz } = useQuizStore();

  // Mock data - replace with real API calls
  const [sections] = useState<Section[]>([
    { id: 1, name: 'Nutrition Science', weight: 25 },
    { id: 2, name: 'Physical Activity', weight: 20 },
    { id: 3, name: 'Behavior Change', weight: 20 },
    { id: 4, name: 'Mental Health & Wellbeing', weight: 15 },
    { id: 5, name: 'Sleep Medicine', weight: 10 },
    { id: 6, name: 'Environmental Health', weight: 10 }
  ]);

  const [questionTypes] = useState<QuestionType[]>([
    { id: 1, name: 'Multiple Choice' },
    { id: 2, name: 'True/False' },
    { id: 3, name: 'Case Studies' },
    { id: 4, name: 'Application Questions' }
  ]);

  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Initialize with all sections and types selected
  useEffect(() => {
    setSelectedSections(sections.map(s => s.id));
    setSelectedTypes(questionTypes.map(t => t.id));
  }, [sections, questionTypes]);

  // Helper functions for select all/deselect all
  const selectAllSections = () => {
    setSelectedSections(sections.map(s => s.id));
  };

  const deselectAllSections = () => {
    setSelectedSections([]);
  };

  const selectAllTypes = () => {
    setSelectedTypes(questionTypes.map(t => t.id));
  };

  const deselectAllTypes = () => {
    setSelectedTypes([]);
  };

  // Toggle individual selections
  const toggleSection = (sectionId: number) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleType = (typeId: number) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Start practice session
  const handleStartSession = async () => {
    if (selectedSections.length === 0 || selectedTypes.length === 0) {
      alert('Please select at least one section and one question type.');
      return;
    }

    if (!user) {
      alert('Please log in to start a practice session.');
      return;
    }

    try {
      setIsStarting(true);
      
      // Initialize quiz with selected preferences
      await initializeQuiz(user.id, {
        mode: 'custom',
        sectionIds: selectedSections,
        questionTypeIds: selectedTypes,
        questionCount: 20 // Default count, could be made configurable
      });

      // Navigate to quiz interface
      navigate('/quiz?mode=custom');
    } catch (error) {
      console.error('Failed to start practice session:', error);
      alert('Failed to start practice session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Lifestyle Medicine Question Bank</h1>
        <p className="subtitle">Select your practice preferences</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleStartSession(); }} className="preferences-form">
        {/* Section Selection */}
        <div className="section-select">
          <h2>Select Sections</h2>
          <div className="select-controls">
            <button type="button" className="control-btn" onClick={selectAllSections}>
              Select All
            </button>
            <button type="button" className="control-btn" onClick={deselectAllSections}>
              Deselect All
            </button>
          </div>
          
          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="checkbox-group">
                <input 
                  type="checkbox" 
                  id={`section-${section.id}`}
                  checked={selectedSections.includes(section.id)}
                  onChange={() => toggleSection(section.id)}
                />
                <label 
                  htmlFor={`section-${section.id}`}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <span>{section.name} (Weight: {section.weight}%)</span>
                  {selectedSections.includes(section.id) && (
                    <Check className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Question Type Selection */}
        <div className="type-select">
          <h2>Select Question Types</h2>
          <div className="select-controls">
            <button type="button" className="control-btn" onClick={selectAllTypes}>
              Select All
            </button>
            <button type="button" className="control-btn" onClick={deselectAllTypes}>
              Deselect All
            </button>
          </div>
          
          <div className="space-y-2">
            {questionTypes.map((type) => (
              <div key={type.id} className="checkbox-group">
                <input 
                  type="checkbox" 
                  id={`type-${type.id}`}
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => toggleType(type.id)}
                />
                <label 
                  htmlFor={`type-${type.id}`}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <span>{type.name}</span>
                  {selectedTypes.includes(type.id) && (
                    <Check className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="start-container">
          <button 
            type="submit" 
            className="start-btn"
            disabled={isStarting || selectedSections.length === 0 || selectedTypes.length === 0}
          >
            {isStarting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting Session...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Start Practice Session</span>
              </div>
            )}
          </button>
        </div>

        {/* Selection Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="mb-2">
            <strong>Selected:</strong> {selectedSections.length} sections, {selectedTypes.length} question types
          </p>
          {(selectedSections.length === 0 || selectedTypes.length === 0) && (
            <p className="text-red-600">
              Please select at least one section and one question type to continue.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};