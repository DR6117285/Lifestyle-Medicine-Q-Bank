/**
 * EXAM SECTION WEIGHTS
 * 
 * These weights represent the percentage distribution of questions 
 * in the real Lifestyle Medicine exam. They should be used for:
 * - Generating realistic exam simulations
 * - Weighting random question selection
 * - Providing users with accurate exam preparation guidance
 */

export const SECTION_WEIGHTS = {
  "Introduction to Lifestyle Medicine": 4, 
  "Fundamentals of Health Behavior Change": 10,
  "Key Clinical Processes in Lifestyle Medicine": 8, 
  "The Role of The Practitioners Health and Community Advocacy": 4, 
  "Nutrition Science Assessment and Prescription Guidelines": 26, 
  "Physical Activity Science and Prescription": 14, 
  "Emotional and Mental Health Assessment and Interventions": 10, 
  "Sleep Health Science and Interventions": 8, 
  "Managing Tobacco Cessation and other Toxic Exposures": 8, 
  "The Role of Connectedness and Positive Psychology": 8
} as const;

export type SectionName = keyof typeof SECTION_WEIGHTS;

/**
 * Get the weight percentage for a given section
 */
export const getSectionWeight = (sectionName: string): number => {
  return SECTION_WEIGHTS[sectionName as SectionName] || 0;
};

/**
 * Get all sections sorted by weight (highest first)
 */
export const getSectionsByWeight = (): Array<{name: SectionName, weight: number}> => {
  return Object.entries(SECTION_WEIGHTS)
    .map(([name, weight]) => ({ name: name as SectionName, weight }))
    .sort((a, b) => b.weight - a.weight);
};

/**
 * Calculate if question distribution matches exam weights
 * within acceptable tolerance
 */
export const isWeightDistributionValid = (
  questionCounts: Record<string, number>, 
  tolerance: number = 5
): boolean => {
  const totalQuestions = Object.values(questionCounts).reduce((sum, count) => sum + count, 0);
  
  for (const [section, expectedWeight] of Object.entries(SECTION_WEIGHTS)) {
    const actualCount = questionCounts[section] || 0;
    const actualWeight = (actualCount / totalQuestions) * 100;
    const difference = Math.abs(actualWeight - expectedWeight);
    
    if (difference > tolerance) {
      return false;
    }
  }
  
  return true;
};