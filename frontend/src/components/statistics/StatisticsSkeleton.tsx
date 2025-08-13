import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface StatisticsSkeletonProps {
  cards?: number;
  showSectionBreakdown?: boolean;
  showRecentSessions?: boolean;
  showRecommendations?: boolean;
}

export const StatisticsSkeleton: React.FC<StatisticsSkeletonProps> = ({
  cards = 6,
  showSectionBreakdown = true,
  showRecentSessions = true,
  showRecommendations = true
}) => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-slate-300 rounded w-64 mb-2"></div>
        <div className="h-4 bg-slate-300 rounded w-96 mb-1"></div>
        <div className="h-3 bg-slate-300 rounded w-48"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(cards)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-slate-300 rounded w-24"></div>
              <div className="h-4 w-4 bg-slate-300 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-300 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section breakdown skeleton */}
      {showSectionBreakdown && (
        <Card>
          <CardHeader>
            <div className="h-5 bg-slate-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-slate-300 rounded w-72"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-300 rounded w-64"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 bg-slate-300 rounded w-12"></div>
                      <div className="h-4 bg-slate-300 rounded w-10"></div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-300 rounded-full h-2">
                    <div 
                      className="h-2 bg-slate-400 rounded-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions skeleton */}
      {showRecentSessions && (
        <Card>
          <CardHeader>
            <div className="h-5 bg-slate-300 rounded w-36 mb-2"></div>
            <div className="h-4 bg-slate-300 rounded w-64"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="h-4 bg-slate-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-300 rounded w-48"></div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="h-5 bg-slate-300 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-slate-300 rounded w-8"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-4 bg-slate-300 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-slate-300 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations skeleton */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <div className="h-5 bg-slate-300 rounded w-40 mb-2"></div>
            <div className="h-4 bg-slate-300 rounded w-80"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-4 bg-slate-300 rounded w-32"></div>
                        <div className="h-4 bg-slate-300 rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-slate-300 rounded w-full mb-2"></div>
                      <div className="h-3 bg-slate-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatisticsSkeleton;