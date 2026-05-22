import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';

import {
  PlotCropRecommendation,
  SoilAnalysisJob,
  SubmitSoilAnalysisRequest,
  SubmitSoilAnalysisResponse,
} from '../../types/soilAnalysis/soilAnalysis';

export const soilAnalysisService = {

  /**
   * Submit AI soil analysis job
   * POST /api/v1/soil-analysis
   */
  async submitAnalysis(
    data: SubmitSoilAnalysisRequest,
  ): Promise<ApiResponse<SubmitSoilAnalysisResponse>> {

    const response = await axiosInstance.post<
      ApiResponse<SubmitSoilAnalysisResponse>
    >(
      '/api/v1/soil-analysis',
      data,
    );

    return response.data;
  },

  /**
   * Poll job status
   * GET /api/v1/soil-analysis/{jobId}
   */
  async getJobStatus(
    jobId: string,
  ): Promise<ApiResponse<SoilAnalysisJob>> {

    const response = await axiosInstance.get<
      ApiResponse<SoilAnalysisJob>
    >(
      `/api/v1/soil-analysis/${jobId}`,
    );

    return response.data;
  },

  /**
   * Get crop recommendations for a specific plot
   * GET /api/v1/soil-analysis/plot/{plotId}
   */
  async getPlotCropRecommendations(
    plotId: string,
  ): Promise<ApiResponse<PlotCropRecommendation[]>> {

    const response = await axiosInstance.get<
      ApiResponse<PlotCropRecommendation[]>
    >(
      `/api/v1/soil-analysis/plot/${plotId}`,
    );

    return response.data;
  },
};