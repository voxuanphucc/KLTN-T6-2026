import { X, Leaf, Loader2 } from 'lucide-react';
import { PlotCropRecommendation } from '@/types/soilAnalysis/soilAnalysis';

interface Props {
  isOpen: boolean;
  plotName?: string;
  recommendations: PlotCropRecommendation[];
  loading: boolean;
  error?: unknown;
  onClose: () => void;
}

export function PlotCropRecommendationModal({
  isOpen,
  plotName,
  recommendations,
  loading,
  error,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Leaf size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cây trồng phù hợp cho lô đất</h2>
              <p className="text-sm text-slate-500 mt-1">{plotName || 'Lô đất'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="mt-4 text-sm">Đang tải đề xuất cây trồng...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-red-700">
              <p className="font-semibold">Không thể lấy đề xuất cây trồng.</p>
              <p className="text-sm mt-2">{String(error)}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600 text-center">
              <p className="font-semibold">Chưa có đề xuất cây trồng.</p>
              <p className="text-sm mt-2">Vui lòng thử lại sau hoặc kiểm tra cấu hình lô đất.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div key={recommendation.crop.id} className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{recommendation.crop.name}</h3>
                      {recommendation.crop.cropType?.name && (
                        <p className="text-sm text-slate-500 mt-1">Loại: {recommendation.crop.cropType.name}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
                      <Leaf size={14} />
                      {recommendation.suitabilityPercent?.toFixed(0)}%
                    </span>
                  </div>

                  {recommendation.recommendationReason && (
                    <div className="text-sm text-slate-700 mb-2">
                      <span className="font-semibold">Lý do đề xuất: </span>
                      {recommendation.recommendationReason}
                    </div>
                  )}

                  {recommendation.description && (
                    <p className="text-sm text-slate-600">{recommendation.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
