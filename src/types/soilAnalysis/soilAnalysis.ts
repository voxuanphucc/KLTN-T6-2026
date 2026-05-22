export type SoilAnalysisJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

export interface SoilAnalysisJob {
  id: string;
  soilRecordId?: string;

  status: SoilAnalysisJobStatus;

  error?: string;

  fileUrl: string;

  sampledAt: string;

  createdAt: string;
  updatedAt?: string;

  result?: string;

  plot?: {
    id: string;
    name?: string;
  };
}

export interface SubmitSoilAnalysisRequest {
  plotId: string;
  farmId: string;
  sampledAt: string;
  fileUrl: string;
}

export interface SubmitSoilAnalysisResponse {
  jobId: string;
  status: SoilAnalysisJobStatus;
  pollUrl: string;
}

export interface CropTypeResponse {
  id?: string;
  name?: string;
  description?: string;
}

export type CropScope = string;

export interface CropResponse {
  id: string;
  name: string;
  version?: number;
  cropType?: CropTypeResponse;
  scope?: CropScope;
  clonedFromId?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

export interface PlotCropRecommendation {
  crop: CropResponse;
  suitabilityPercent: number;
  recommendationReason?: string;
  description?: string;
}