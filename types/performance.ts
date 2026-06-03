export type RatingColor = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';

export interface PerformanceMetrics {
  id?: string;
  memberId: string;
  periodYear: number;
  periodWeek: number;
  ikrScore: number;       // 60% weight
  competencyScore: number; // 40% weight
  finalScore: number;
  rating: RatingColor;
  createdAt?: string;
  updatedAt?: string;
}

// utility to calculate score and rating
export const calculatePerformance = (ikr: number, competency: number) => {
  const finalScore = (ikr * 0.6) + (competency * 0.4);
  let rating: RatingColor = 'Kurang';
  
  if (finalScore >= 90) rating = 'Sangat Baik';
  else if (finalScore >= 75) rating = 'Baik';
  else if (finalScore >= 60) rating = 'Cukup';
  
  return { finalScore: Number(finalScore.toFixed(2)), rating };
};
