export interface VertexRecommenderPrediction {
  strain_id: string;
  percentage: number;
}

export interface VertexRecommenderResponse {
  predictions: VertexRecommenderPrediction[];
}

export interface StrainDetails {
  objectId: string;
  strain_id: string;
  percentage?: number;
  name: string;
  strain?: string;
  conditions?: string | string[];
  symptoms?: string | string[];
  effects?: string | string[];
  negatives?: string | string[];
}

export interface EnrichedStrain {
  strain_id: string;
  percentage: number;
  details: StrainDetails;
}

export interface GroupedStrainRef {
  strain_id: string;
  percentage: number;
  details: Partial<StrainDetails>
}

export interface GroupedRecommendation {
  type: string;
  name: string;
  text: string;
  strains: GroupedStrainRef[];
}

export interface RecommendationResponse {
  user_id: string;
  strainOfTheDay?: GroupedStrainRef
  recommendations: GroupedRecommendation[];
}
