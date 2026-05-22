import { Edit2Icon, Trash2Icon, MapIcon, Leaf } from 'lucide-react'
import { Plot } from '@/types/plot'
import { PlotStatusBadge } from './PlotStatusBadge'

interface PlotTableProps {
  plots: Plot[]
  onEdit: (plot: Plot) => void
  onDelete: (plot: Plot) => void
  onViewMap: (plot: Plot) => void
  onViewRecommendations: (plot: Plot) => void
}

export function PlotTable({
  plots,
  onEdit,
  onDelete,
  onViewMap,
  onViewRecommendations,
}: PlotTableProps) {
  if (plots.length === 0) {
    return (
      <div className="bg-transparent py-24 font-sans flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          <MapIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Không tìm thấy lô đất nào
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Thử thay đổi bộ lọc hoặc tạo lô đất mới.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-transparent overflow-hidden font-sans text-left">
      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500">Tên lô đất</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500">Diện tích (ha)</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500">Trạng thái</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500">Mô tả</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plots.map((plot) => (
              <tr
                key={plot.id}
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${plot.status === 'ACTIVE' ? 'bg-[#2e7d32]' : 'bg-[#c62828]'}`} />
                  {plot.name}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {plot.areaHa == null ? 0 : plot.areaHa.toLocaleString('en-US')}
                </td>
                <td className="px-6 py-4">
                  <PlotStatusBadge status={plot.status} />
                </td>
                <td
                  className="px-6 py-4 max-w-xs truncate text-slate-500 font-medium"
                  title={plot.description}
                >
                  {plot.description || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewMap(plot)}
                      className="p-2 text-slate-600 bg-white border border-slate-200 hover:text-emerald-700 hover:border-emerald-300 rounded-lg transition-all shadow-sm"
                      title="Xem trên bản đồ"
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onViewRecommendations(plot)}
                      className="p-2 text-slate-600 bg-white border border-slate-200 hover:text-emerald-700 hover:border-emerald-300 rounded-lg transition-all shadow-sm"
                      title="Xem cây trồng phù hợp"
                    >
                      <Leaf className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(plot)}
                      className="p-2 text-slate-600 bg-white border border-slate-200 hover:text-emerald-700 hover:border-emerald-300 rounded-lg transition-all shadow-sm"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(plot)}
                      className="p-2 text-slate-600 bg-white border border-slate-200 hover:text-red-700 hover:border-red-300 rounded-lg transition-all shadow-sm"
                      title="Xóa"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
