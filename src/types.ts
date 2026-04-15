export interface CropAnalysis {
  crop_type: string;
  soil_type: string;
  temperature: string;
  confidence: string;
}

export interface HealthAnalysis {
  crop_health_score: number;
  nutrition_score: number;
  water_score: number;
  disease_risk: number;
  mineral_deficiency: {
    Nitrogen: number;
    Phosphorus: number;
    Potassium: number;
  };
}

export interface Solutions {
  gharelu_nuske: string[];
  recommended_fertilizers: string[];
  watering_suggestions: string[];
  disease_treatment: string[];
  action_plan: string[];
}

export interface Insights {
  what_is_good: string;
  what_is_wrong: string;
  why_scores: string;
}

export interface FullReport {
  analysis: CropAnalysis;
  health: HealthAnalysis;
  insights: Insights;
  solutions: Solutions;
}

export type AppStep = 'upload' | 'verifying' | 'confirmed' | 'analyzing' | 'results';
