import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Play, 
  BookOpen, 
  Brain, 
  Users, 
  Heart, 
  Activity, 
  Shield, 
  Moon, 
  Leaf,
  GraduationCap,
  FileText,
  Stethoscope,
  Award,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuizStore } from '@/stores/quizStore';

interface Section {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: React.ElementType;
  questionCount: number;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  color: string;
}

interface QuestionType {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  count: number;
  difficulty: string;
}

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { initializeQuiz } = useQuizStore();

  // Real sections based on actual question data structure
  const [sections] = useState<Section[]>([
    { 
      id: 1, 
      name: 'Introduction to Lifestyle Medicine', 
      shortName: 'Introduction',
      description: 'Foundational principles and evidence-based approaches to lifestyle medicine',
      icon: GraduationCap,
      questionCount: 45,
      difficulty: 'Foundational',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 2, 
      name: 'Fundamentals of Health Behavior Change', 
      shortName: 'Behavior Change',
      description: 'Psychology and strategies for sustainable health behavior modification',
      icon: Brain,
      questionCount: 52,
      difficulty: 'Intermediate',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 3, 
      name: 'Key Clinical Processes in Lifestyle Medicine', 
      shortName: 'Clinical Processes',
      description: 'Clinical applications and patient care protocols in lifestyle medicine',
      icon: Stethoscope,
      questionCount: 38,
      difficulty: 'Advanced',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 4, 
      name: 'The Role of The Practitioners Health and Community Advocacy', 
      shortName: 'Practitioner Health',
      description: 'Professional wellness and community health advocacy principles',
      icon: Users,
      questionCount: 29,
      difficulty: 'Intermediate',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      id: 5, 
      name: 'Nutrition Science Assessment and Prescription Guidelines', 
      shortName: 'Nutrition Science',
      description: 'Evidence-based nutritional interventions and assessment protocols',
      icon: Heart,
      questionCount: 61,
      difficulty: 'Advanced',
      color: 'from-red-500 to-red-600'
    },
    { 
      id: 6, 
      name: 'Physical Activity Science and Prescription', 
      shortName: 'Physical Activity',
      description: 'Exercise physiology and therapeutic physical activity prescription',
      icon: Activity,
      questionCount: 43,
      difficulty: 'Intermediate',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      id: 7, 
      name: 'Emotional and Mental Health Assessment and Interventions', 
      shortName: 'Mental Health',
      description: 'Psychological wellness assessment and intervention strategies',
      icon: Shield,
      questionCount: 37,
      difficulty: 'Advanced',
      color: 'from-teal-500 to-teal-600'
    },
    { 
      id: 8, 
      name: 'Sleep Health Science and Interventions', 
      shortName: 'Sleep Health',
      description: 'Sleep medicine principles and therapeutic interventions',
      icon: Moon,
      questionCount: 33,
      difficulty: 'Intermediate',
      color: 'from-cyan-500 to-cyan-600'
    },
    { 
      id: 9, 
      name: 'Managing Tobacco Cessation and other Toxic Exposures', 
      shortName: 'Toxic Exposures',
      description: 'Cessation strategies and environmental health risk management',
      icon: Leaf,
      questionCount: 28,
      difficulty: 'Intermediate',
      color: 'from-emerald-500 to-emerald-600'
    },
    { 
      id: 10, 
      name: 'The Role of Connectedness and Positive Psychology', 
      shortName: 'Positive Psychology',
      description: 'Social connections and positive psychology in health outcomes',
      icon: BookOpen,
      questionCount: 25,
      difficulty: 'Foundational',
      color: 'from-pink-500 to-pink-600'
    }
  ]);

  // Real question types based on actual data structure
  const [questionTypes] = useState<QuestionType[]>([
    { 
      id: 1, 
      name: 'General Knowledge', 
      description: 'Core curriculum questions testing foundational understanding',
      icon: BookOpen,
      count: 284,
      difficulty: 'Mixed Difficulty'
    },
    { 
      id: 2, 
      name: 'Study-Tool Based', 
      description: 'Research-focused questions emphasizing studies and evidence',
      icon: FileText,
      count: 156,
      difficulty: 'Advanced'
    },
    { 
      id: 3, 
      name: 'Board Review Supplementary', 
      description: 'Additional board preparation content and clinical applications',
      icon: Award,
      count: 98,
      difficulty: 'Board-Level'
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-medical-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-medical-600/10 to-blue-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-medical-500 to-medical-600 rounded-2xl shadow-lg">
                <Stethoscope className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Lifestyle Medicine
              <span className="block text-medical-600 mt-2">Question Bank</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Master lifestyle medicine with our comprehensive question bank featuring evidence-based content, 
              interactive learning, and board-style assessments designed for healthcare professionals.
            </p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl font-bold text-medical-600 mb-2">
                  {sections.reduce((total, section) => total + section.questionCount, 0)}
                </div>
                <div className="text-gray-600 font-medium">Total Questions</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">{sections.length}</div>
                <div className="text-gray-600 font-medium">Core Sections</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl font-bold text-purple-600 mb-2">{questionTypes.length}</div>
                <div className="text-gray-600 font-medium">Question Types</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <form onSubmit={(e) => { e.preventDefault(); handleStartSession(); }} className="space-y-12">
          
          {/* Section Selection */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-medical-500 to-medical-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Study Sections</h2>
                    <p className="text-medical-100 mt-1">Choose your areas of focus</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-medium"
                    onClick={selectAllSections}
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-medium"
                    onClick={deselectAllSections}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  const isSelected = selectedSections.includes(section.id);
                  return (
                    <div 
                      key={section.id}
                      className={`relative group cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'scale-105 shadow-lg ring-2 ring-medical-500' 
                          : 'hover:scale-102 hover:shadow-md'
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className={`
                        rounded-2xl border-2 transition-all duration-300 overflow-hidden
                        ${isSelected 
                          ? 'border-medical-500 bg-gradient-to-br from-medical-50 to-white' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}>
                        {/* Gradient Header */}
                        <div className={`bg-gradient-to-r ${section.color} p-4`}>
                          <div className="flex items-center justify-between text-white">
                            <IconComponent className="h-8 w-8" />
                            <div className={`
                              w-6 h-6 rounded-full border-2 transition-all duration-200
                              ${isSelected 
                                ? 'bg-white border-white' 
                                : 'border-white/60 hover:border-white'
                              }
                            `}>
                              {isSelected && (
                                <Check className="h-4 w-4 text-medical-600 m-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight">
                            {section.shortName}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {section.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className={`
                                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                ${section.difficulty === 'Foundational' 
                                  ? 'bg-green-100 text-green-800' 
                                  : section.difficulty === 'Intermediate'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }
                              `}>
                                {section.difficulty}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {section.questionCount} questions
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Type Selection */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="h-8 w-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Question Types</h2>
                    <p className="text-purple-100 mt-1">Select your preferred question formats</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-medium"
                    onClick={selectAllTypes}
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-medium"
                    onClick={deselectAllTypes}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {questionTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = selectedTypes.includes(type.id);
                  return (
                    <div 
                      key={type.id}
                      className={`relative group cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'scale-105 shadow-lg ring-2 ring-purple-500' 
                          : 'hover:scale-102 hover:shadow-md'
                      }`}
                      onClick={() => toggleType(type.id)}
                    >
                      <div className={`
                        rounded-2xl border-2 transition-all duration-300 overflow-hidden h-full
                        ${isSelected 
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-white' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}>
                        {/* Header */}
                        <div className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`
                              w-12 h-12 rounded-2xl flex items-center justify-center
                              ${isSelected ? 'bg-purple-500' : 'bg-gray-100 group-hover:bg-gray-200'}
                              transition-colors duration-200
                            `}>
                              <IconComponent className={`h-6 w-6 ${
                                isSelected ? 'text-white' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className={`
                              w-6 h-6 rounded-full border-2 transition-all duration-200
                              ${isSelected 
                                ? 'bg-purple-500 border-purple-500' 
                                : 'border-gray-300 hover:border-gray-400'
                              }
                            `}>
                              {isSelected && (
                                <Check className="h-4 w-4 text-white m-0.5" />
                              )}
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 mb-2 text-lg">
                            {type.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {type.description}
                          </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 pb-6">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {type.difficulty}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {type.count} questions
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="bg-gradient-to-r from-medical-500 to-medical-600 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-12 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Begin Your Study Session?
                </h2>
                <p className="text-medical-100 mb-8 text-lg">
                  You've selected {selectedSections.length} sections and {selectedTypes.length} question types. 
                  Start your personalized practice session now.
                </p>

                {/* Selection Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="text-2xl font-bold text-white mb-2">
                      {selectedSections.length}
                    </div>
                    <div className="text-medical-100">Sections Selected</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="text-2xl font-bold text-white mb-2">
                      {selectedTypes.length}
                    </div>
                    <div className="text-medical-100">Question Types</div>
                  </div>
                </div>

                {/* Start Button */}
                <button 
                  type="submit" 
                  className={`
                    group relative px-12 py-4 bg-white text-medical-600 rounded-2xl font-bold text-lg
                    transition-all duration-300 shadow-lg hover:shadow-xl
                    ${(isStarting || selectedSections.length === 0 || selectedTypes.length === 0)
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-105 hover:bg-gray-50 active:scale-95'
                    }
                  `}
                  disabled={isStarting || selectedSections.length === 0 || selectedTypes.length === 0}
                >
                  {isStarting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-medical-600 border-t-transparent"></div>
                      <span>Launching Session...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Play className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                      <span>Start Practice Session</span>
                    </div>
                  )}
                </button>

                {(selectedSections.length === 0 || selectedTypes.length === 0) && (
                  <p className="text-red-200 mt-4 text-sm">
                    Please select at least one section and one question type to continue.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your learning journey with detailed analytics and progress tracking.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Evidence-Based</h3>
            <p className="text-gray-600">
              All questions are based on current research and clinical best practices.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Adaptive Learning</h3>
            <p className="text-gray-600">
              Personalized question selection based on your performance and preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};