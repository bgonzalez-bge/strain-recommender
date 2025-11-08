export interface VertexRecommenderPrediction {
  strain_id: string;
  percentage: number;
}

export interface VertexRecommenderResponse {
  predictions: VertexRecommenderPrediction[];
}

export interface StrainDetails {
  strain_id: string;
  percentage?: number;
  name: string;
  type?: string;
  conditions?: string | string[];
  symptoms?: string | string[];
  effects?: string | string[];
  [key: string]: any;
}

export interface EnrichedStrain {
  strain_id: string;
  percentage: number;
  details?: StrainDetails;
}

export interface GroupedStrainRef {
  strain_id: string;
  percentage: number;
}

export interface GroupedRecommendation {
  type: string;
  name: string;
  text: string;
  strains: GroupedStrainRef[];
}

export interface RecommendationResponse {
  user_id: string;
  recommendations: GroupedRecommendation[];
  strains: Partial<StrainDetails>[];
}
