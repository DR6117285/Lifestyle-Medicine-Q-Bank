import React from 'react';
import { BookOpen, Users, Trophy, Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const features = [
  {
    icon: BookOpen,
    title: 'Comprehensive Question Bank',
    description: 'Access thousands of lifestyle medicine questions with detailed explanations.',
  },
  {
    icon: Users,
    title: 'Interactive Learning',
    description: 'Learn with a community of healthcare professionals and students.',
  },
  {
    icon: Trophy,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with detailed analytics and performance insights.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security and privacy measures.',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title = 'Welcome to LMQB',
  subtitle = 'Lifestyle Medicine Question Bank'
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Branding and Features */}
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="grid grid-cols-6 gap-4 h-full opacity-50">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-full w-2 h-2" />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo and Title */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-white rounded-lg p-3 mr-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">LMQB</h1>
                  <p className="text-blue-100 text-lg">{subtitle}</p>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                Master lifestyle medicine with our comprehensive question bank designed for healthcare professionals and students.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-blue-100 text-sm">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10+</div>
                <div className="text-blue-100 text-sm">Topics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-sm text-gray-500">
          © 2024 LMQB. All rights reserved. | Empowering healthcare through lifestyle medicine education.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;