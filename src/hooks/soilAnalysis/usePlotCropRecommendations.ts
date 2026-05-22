import { useQuery } from '@tanstack/react-query';

import { soilAnalysisService } from '../../services/soilAnalysis/soilAnalysisService';
import { PlotCropRecommendation } from '../../types/soilAnalysis/soilAnalysis';

const PLOT_CROP_RECOMMENDATION_QUERY_KEY = (plotId?: string) => ['soil-analysis', 'plot-crop-recommendations', plotId ?? 'none'] as const;

export const usePlotCropRecommendations = (plotId?: string) => {
  const query = useQuery<PlotCropRecommendation[]>({
    queryKey: PLOT_CROP_RECOMMENDATION_QUERY_KEY(plotId),
    queryFn: async () => {
      if (!plotId) return [];
      const response = await soilAnalysisService.getPlotCropRecommendations(plotId);
      return response.data ?? [];
    },
    enabled: Boolean(plotId),
    staleTime: 0,
  });

  return {
    recommendations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
