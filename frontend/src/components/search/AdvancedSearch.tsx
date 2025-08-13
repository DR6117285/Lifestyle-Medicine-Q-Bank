import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Calendar, 
  Tag, 
  BookOpen,
  Clock,
  Target,
  Star,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  query: string;
  categories: string[];
  difficulties: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  accuracy: {
    min: number;
    max: number;
  };
  tags: string[];
  sortBy: 'relevance' | 'date' | 'difficulty' | 'accuracy' | 'category';
  sortOrder: 'asc' | 'desc';
  showAnswered: boolean;
  showUnanswered: boolean;
  showFavorites: boolean;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableCategories?: string[];
  availableTags?: string[];
  isLoading?: boolean;
  resultCount?: number;
  className?: string;
}

const defaultFilters: SearchFilters = {
  query: '',
  categories: [],
  difficulties: [],
  dateRange: { start: null, end: null },
  accuracy: { min: 0, max: 100 },
  tags: [],
  sortBy: 'relevance',
  sortOrder: 'desc',
  showAnswered: true,
  showUnanswered: true,
  showFavorites: false,
};

const difficulties = ['easy', 'medium', 'hard'];

const sortOptions = [
  { value: 'relevance', label: 'Relevance', icon: Target },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'difficulty', label: 'Difficulty', icon: BookOpen },
  { value: 'accuracy', label: 'Accuracy', icon: Star },
  { value: 'category', label: 'Category', icon: Tag },
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  availableCategories = ['Nutrition', 'Exercise', 'Mental Health', 'Preventive Care', 'Community Health'],
  availableTags = ['Board Exam', 'Quick Review', 'Case Study', 'Research', 'Guidelines'],
  isLoading = false,
  resultCount = 0,
  className
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query);
  
  const debouncedQuery = useDebounce(localQuery, 300);

  // Update filters when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery !== filters.query) {
      onFiltersChange({ ...filters, query: debouncedQuery });
    }
  }, [debouncedQuery, filters, onFiltersChange]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleCategory = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', newCategories);
  }, [filters.categories, updateFilter]);

  const toggleDifficulty = useCallback((difficulty: string) => {
    const newDifficulties = filters.difficulties.includes(difficulty)
      ? filters.difficulties.filter(d => d !== difficulty)
      : [...filters.difficulties, difficulty];
    updateFilter('difficulties', newDifficulties);
  }, [filters.difficulties, updateFilter]);

  const toggleTag = useCallback((tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilter('tags', newTags);
  }, [filters.tags, updateFilter]);

  const clearAllFilters = useCallback(() => {
    setLocalQuery('');
    onFiltersChange({ ...defaultFilters, query: '' });
  }, [onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.categories.length > 0) count++;
    if (filters.difficulties.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.accuracy.min > 0 || filters.accuracy.max < 100) count++;
    if (!filters.showAnswered || !filters.showUnanswered) count++;
    if (filters.showFavorites) count++;
    return count;
  }, [filters]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-success-300 text-success-700 bg-success-50';
      case 'medium': return 'border-slate-300 text-slate-700 bg-slate-50';
      case 'hard': return 'border-error-300 text-error-700 bg-error-50';
      default: return 'border-slate-300 text-slate-700';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
        <Input
          placeholder="Search questions, topics, or keywords..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-9 pr-12 h-12 text-base"
          disabled={isLoading}
        />
        {localQuery && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLocalQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters and Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              showAdvancedFilters && "rotate-180"
            )} />
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            >
              Clear All
            </Button>
          )}
        </div>

        {resultCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {isLoading ? 'Searching...' : `${resultCount} results`}
            </span>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Sort:</Label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  updateFilter('sortBy', sortBy as SearchFilters['sortBy']);
                  updateFilter('sortOrder', sortOrder as SearchFilters['sortOrder']);
                }}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                {sortOptions.map(option => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-desc`}>
                      {option.label} ↓
                    </option>
                    <option value={`${option.value}-asc`}>
                      {option.label} ↑
                    </option>
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              "{filters.query}"
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLocalQuery('');
                  updateFilter('query', '');
                }}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {category}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleCategory(category)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {filters.difficulties.map(difficulty => (
            <Badge key={difficulty} variant="outline" className={cn("gap-1", getDifficultyColor(difficulty))}>
              <Target className="h-3 w-3" />
              {difficulty}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleDifficulty(difficulty)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {filters.tags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {tag}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleTag(tag)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Categories */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Difficulty</Label>
              <div className="flex gap-2">
                {difficulties.map(difficulty => (
                  <Button
                    key={difficulty}
                    size="sm"
                    variant={filters.difficulties.includes(difficulty) ? "default" : "outline"}
                    onClick={() => toggleDifficulty(difficulty)}
                    className={cn(
                    "capitalize",
                    !filters.difficulties.includes(difficulty) && "hover:border-slate-300",
                      filters.difficulties.includes(difficulty) && getDifficultyColor(difficulty)
                      )}
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Accuracy Range */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Accuracy Range: {filters.accuracy.min}% - {filters.accuracy.max}%
              </Label>
              <div className="px-2">
                <Slider
                  value={[filters.accuracy.min, filters.accuracy.max]}
                  onValueChange={([min, max]) => updateFilter('accuracy', { min, max })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Question Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-answered"
                    checked={filters.showAnswered}
                    onCheckedChange={(checked) => updateFilter('showAnswered', !!checked)}
                  />
                  <Label htmlFor="show-answered" className="text-sm">
                    Show answered questions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-unanswered"
                    checked={filters.showUnanswered}
                    onCheckedChange={(checked) => updateFilter('showUnanswered', !!checked)}
                  />
                  <Label htmlFor="show-unanswered" className="text-sm">
                    Show unanswered questions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-favorites"
                    checked={filters.showFavorites}
                    onCheckedChange={(checked) => updateFilter('showFavorites', !!checked)}
                  />
                  <Label htmlFor="show-favorites" className="text-sm">
                    Show favorites only
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};