# LMQB Statistics System

## Overview

The LMQB Statistics System provides comprehensive analytics and insights for learners to track their progress, identify strengths and weaknesses, and receive personalized study recommendations.

## Architecture

### 1. Data Layer (`types/statistics.ts`)
- **UserStatistics**: Overall performance metrics
- **SectionStatistics**: Performance breakdown by topic
- **RecentSession**: Individual quiz session data
- **StudyRecommendation**: AI-generated study suggestions
- **ProgressOverTime**: Trend data for analytics

### 2. Service Layer (`services/statisticsService.ts`)
- **StatisticsService**: Core business logic
- Database queries and aggregations
- Statistics calculations and trend analysis
- Recommendation engine logic

### 3. Store Layer (`stores/statisticsStore.ts`)
- **Zustand store** with persistence
- Caching mechanism (5-minute expiry)
- Real-time updates on quiz completion
- Loading and error state management

### 4. UI Layer (`pages/Statistics.tsx`)
- Responsive statistics dashboard
- Loading skeletons and error states
- Real-time data refresh
- Interactive elements and navigation

## Key Features

### Overall Performance Metrics
- Total questions attempted
- Overall accuracy percentage
- Average time per question
- Study streaks (current and best)
- Total study time
- Study days count

### Section-Level Analytics
- Performance by lifestyle medicine topics
- Accuracy trends and difficulty levels
- Time spent per section
- Improvement indicators
- Last attempted dates

### Recent Activity Tracking
- Latest quiz sessions with scores
- Session type identification
- Performance level categorization
- Time tracking and limits

### Intelligent Recommendations
- Weakness identification (accuracy < 70%)
- Strength reinforcement (accuracy >= 85%)
- Consistency encouragement
- Time management tips
- Practice buttons for weak areas

### Comparative Analytics
- User vs. average performance
- Percentile rankings
- Peer comparison insights

## Usage

### Basic Implementation

```typescript
import { useStatisticsData, useStatisticsActions } from '../stores/statisticsStore';

function MyComponent() {
  const { statistics, isLoading, error } = useStatisticsData();
  const { fetchStatistics, refreshStatistics } = useStatisticsActions();
  
  useEffect(() => {
    if (userId) {
      fetchStatistics(userId);
    }
  }, [userId, fetchStatistics]);
  
  if (isLoading) return <StatisticsSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <StatisticsDashboard data={statistics} />;
}
```

### Specific Data Access

```typescript
import { 
  useOverallStats, 
  useSectionStats, 
  useRecentSessions,
  useRecommendations 
} from '../stores/statisticsStore';

function PerformanceCard() {
  const overallStats = useOverallStats();
  
  return (
    <div>
      <h3>Accuracy: {overallStats?.accuracy_percentage.toFixed(1)}%</h3>
      <p>Total Questions: {overallStats?.total_questions}</p>
    </div>
  );
}
```

### Quiz Integration

The statistics automatically update when quizzes are completed:

```typescript
// In quiz completion handler
const result = await completeQuiz();
// Statistics store automatically refreshes via handleQuizCompletion()
```

## Database Integration

### Required Queries

The service layer uses several key SQL queries:

```sql
-- Overall Statistics (from materialized view)
SELECT * FROM user_statistics WHERE user_id = $1;

-- Section Breakdown
SELECT 
  s.name as section_name,
  COUNT(*) as questions_attempted,
  AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as accuracy,
  AVG(qa.time_taken) as avg_time
FROM quiz_attempts qa
JOIN quiz_sessions qs ON qa.session_id = qs.id
JOIN questions q ON qa.question_id = q.id
JOIN sections s ON q.section_id = s.id
WHERE qs.user_id = $1
GROUP BY s.id, s.name
ORDER BY accuracy ASC;

-- Recent Sessions
SELECT 
  qs.*,
  s.name as section_name
FROM quiz_sessions qs
LEFT JOIN sections s ON qs.section_id = s.id
WHERE qs.user_id = $1
AND qs.completed_at IS NOT NULL
ORDER BY qs.completed_at DESC
LIMIT 10;
```

### Performance Optimizations

1. **Materialized View**: `user_statistics` view for quick overall stats
2. **Caching**: 5-minute cache in frontend store
3. **Selective Loading**: Only fetch needed data components
4. **Background Refresh**: Non-blocking statistics updates
5. **Proper Indexing**: Database indexes on user_id, completed_at

## Error Handling

### Network Errors
- Fallback to cached data
- Retry mechanisms
- User-friendly error messages

### Empty States
- No quiz history handling
- First-time user experience
- Motivation to start practicing

### Loading States
- Skeleton loading components
- Progressive data loading
- Refresh indicators

## Customization

### Filters

```typescript
const { updateFilters } = useStatisticsActions();

// Filter by date range
updateFilters({
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
});

// Filter by sections
updateFilters({
  sections: [1, 2, 3] // section IDs
});

// Limit results
updateFilters({
  limit: 20
});
```

### Recommendation Engine

The system generates recommendations based on:
- Section accuracy levels
- Study consistency patterns
- Time management metrics
- Performance trends

Customize in `StatisticsService.generateRecommendations()`:

```typescript
// Add custom recommendation types
const customRecommendation = {
  type: 'custom',
  title: 'Custom Suggestion',
  description: 'Your custom message',
  priority: 'high',
  action: 'Take this action'
};
```

## Testing

### Service Layer Tests

```typescript
import { StatisticsService } from './statisticsService';

describe('StatisticsService', () => {
  it('should fetch user statistics', async () => {
    const result = await StatisticsService.getUserStatistics('user-id');
    expect(result.success).toBe(true);
    expect(result.data.overall).toBeDefined();
  });
});
```

### Store Tests

```typescript
import { useStatisticsStore } from './statisticsStore';

describe('StatisticsStore', () => {
  it('should update statistics on fetch', async () => {
    const store = useStatisticsStore.getState();
    await store.fetchStatistics('user-id');
    expect(store.statistics).not.toBeNull();
  });
});
```

## Monitoring

### Performance Metrics
- Database query execution times
- Cache hit/miss ratios
- API response times
- User engagement with recommendations

### Analytics Events
- Statistics page views
- Recommendation clicks
- Filter usage
- Refresh actions

## Future Enhancements

### Planned Features
1. **Progress Charts**: Visual trend analysis
2. **Goal Setting**: Personal targets and milestones
3. **Social Features**: Study group comparisons
4. **Adaptive Recommendations**: ML-based suggestions
5. **Export Options**: PDF reports and data exports

### API Extensions
1. **Webhook Support**: Real-time statistics updates
2. **Bulk Operations**: Multi-user analytics
3. **Advanced Filtering**: Complex query combinations
4. **Aggregation APIs**: Team and organizational stats

## Troubleshooting

### Common Issues

1. **Statistics Not Loading**
   - Check user authentication
   - Verify database connection
   - Check materialized view refresh

2. **Outdated Data**
   - Force refresh with `refreshStatistics()`
   - Check cache expiry settings
   - Verify quiz completion triggers

3. **Performance Issues**
   - Monitor database query performance
   - Check cache effectiveness
   - Review data volume and filtering

### Debug Mode

Enable debug logging:

```typescript
// In statistics service
console.log('Fetching statistics for user:', userId, 'with filters:', filters);
```

### Health Checks

```typescript
// Check statistics system health
const health = {
  cacheValid: store.isDataFresh(),
  lastFetch: store.lastFetch,
  errorState: store.error,
  dataAvailable: !!store.statistics
};
```

This comprehensive statistics system provides learners with actionable insights while maintaining excellent performance and user experience.