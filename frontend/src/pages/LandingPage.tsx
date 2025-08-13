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
import { QuizService } from '@/services/quizService';

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

// Static fallback sections (original hardcoded data)  
const staticSections: Section[] = [
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
    description: 'Assessment, prescription, and follow-up protocols in clinical practice',
    icon: Users,
    questionCount: 38,
    difficulty: 'Intermediate',
    color: 'from-green-500 to-green-600'
  }
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { initializeQuiz } = useQuizStore();
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [realSections, setRealSections] = useState<Section[]>([]);

  // Load real question data from database
  useEffect(() => {
    const loadRealQuestionStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Get total question count
        const totalCount = await QuizService.getQuestionCount();
        setTotalQuestions(totalCount);
        
        // Get sections from database
        const dbSections = await QuizService.getSections();
        
        // Convert database sections to display format with real counts
        const sectionsWithCounts = await Promise.all(
          dbSections.slice(0, 10).map(async (section, index) => {
            const count = await QuizService.getQuestionCount(section.id);
            return {
              id: section.id,
              name: section.name,
              shortName: section.name.length > 30 ? section.name.substring(0, 30) + '...' : section.name,
              description: section.description || `Comprehensive coverage of ${section.name.toLowerCase()}`,
              icon: getSectionIcon(index),
              questionCount: count,
              difficulty: getDifficultyLevel(count),
              color: getSectionColor(index)
            };
          })
        );
        
        setRealSections(sectionsWithCounts);
      } catch (error) {
        console.error('Error loading question stats:', error);
        // Fallback to static data if database fails
        setRealSections(staticSections);
        setTotalQuestions(staticSections.reduce((total, section) => total + section.questionCount, 0));
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadRealQuestionStats();
  }, []);

  // Helper functions
  const getSectionIcon = (index: number) => {
    const icons = [BookOpen, Brain, Users, Heart, Activity, Shield, Moon, Leaf, GraduationCap, FileText];
    return icons[index % icons.length];
  };

  const getDifficultyLevel = (count: number): 'Foundational' | 'Intermediate' | 'Advanced' => {
    if (count < 50) return 'Foundational';
    if (count < 150) return 'Intermediate';
    return 'Advanced';
  };

  const getSectionColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-slate-500 to-slate-600',
      'from-cyan-500 to-cyan-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Hero Section */}
      <div className="relative pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 gradient-medical rounded-2xl flex items-center justify-center shadow-medical-lg">
                <Stethoscope className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Lifestyle Medicine
              <span className="block text-gradient">
                Question Bank
              </span>
            </h1>
            
            <p className="text-xl text-slate-800 font-semibold mb-8 max-w-3xl mx-auto leading-relaxed">
              Master the science and art of lifestyle medicine with our comprehensive question bank designed for healthcare professionals and students.
            </p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-medical border border-border/50">
                <div className="stats-value mb-2">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-muted rounded w-16 h-9 mx-auto"></div>
                  ) : (
                    totalQuestions
                  )}
                </div>
                <div className="stats-label">Total Questions</div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-medical border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-muted rounded w-12 h-9 mx-auto"></div>
                  ) : (
                    realSections.length || staticSections.length
                  )}
                </div>
                <div className="stats-label">Core Sections</div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-medical border border-border/50">
                <div className="text-3xl font-bold text-accent mb-2">3</div>
                <div className="stats-label">Question Types</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/quiz')}
                className="btn-medical group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Start Practice Quiz</span>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/exam')}
                className="btn-medical-outline group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Award className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Take Full Exam</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};