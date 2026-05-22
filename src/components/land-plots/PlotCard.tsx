import { Edit2Icon, Trash2Icon, MapIcon, MaximizeIcon, Leaf } from 'lucide-react'
import { Plot } from '@/types/plot'
import { PlotStatusBadge } from './PlotStatusBadge'

interface PlotCardProps {
  plot: Plot
  onEdit: (plot: Plot) => void
  onDelete: (plot: Plot) => void
  onViewMap: (plot: Plot) => void
  onViewRecommendations: (plot: Plot) => void
}

export function PlotCard({ plot, onEdit, onDelete, onViewMap, onViewRecommendations }: PlotCardProps) {
  return (
    <div className="bg-white transition-all overflow-hidden group font-sans text-left px-4 py-4">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3
            className="text-lg font-bold text-gray-900 truncate pr-2 group-hover:text-emerald-700 transition-colors"
            title={plot.name}
          >
            {plot.name}
          </h3>
          <PlotStatusBadge status={plot.status} />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-600 text-sm bg-gray-50 px-3 py-2 rounded-lg">
            <MaximizeIcon className="w-4 h-4 mr-2 text-emerald-600" />
            <span className="font-bold text-gray-900 mr-1 text-base">
              {plot.areaHa == null ? 0 : plot.areaHa.toLocaleString('vi-VN')}
            </span>{' '}
            ha
          </div>

          {plot.description && (
            <p
              className="text-sm text-gray-500 line-clamp-2 min-h-[40px]"
              title={plot.description}
            >
              {plot.description}
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewMap(plot)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
          >
            <MapIcon className="w-4 h-4" />
            Bản đồ
          </button>
          <button
            onClick={() => onViewRecommendations(plot)}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5"
          >
            <Leaf className="w-4 h-4" />
            Đề xuất
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onEdit(plot)}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            title="Chỉnh sửa thông tin"
          >
            <Edit2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(plot)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Xóa"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
