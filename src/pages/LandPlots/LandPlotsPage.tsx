import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePlots } from '@/hooks/plots/usePlots';
import { usePlotCropRecommendations } from '@/hooks/soilAnalysis/usePlotCropRecommendations';
import { Plot, CreatePlotRequest } from '@/types/plot/plot';
import { extractErrorMessage } from '../../utils/errorUtils';
import { toast } from 'sonner';
import { LayoutGridIcon, PlusIcon, ArrowLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PlotTable } from '@/components/land-plots/PlotTable';
import { PlotCard } from '@/components/land-plots/PlotCard';
import { PlotFilters } from '@/components/land-plots/PlotFilters';
import { CreatePlotModal } from '@/components/land-plots/CreatePlotModal';
import { EditPlotModal } from '@/components/land-plots/EditPlotModal';
import { DeletePlotDialog } from '@/components/land-plots/DeletePlotDialog';
import { PlotCropRecommendationModal } from '@/components/land-plots/PlotCropRecommendationModal';

export function LandPlotsPage() {
  const navigate = useNavigate();
  const { currentFarmId } = useAuth();
  const { plots, createPlot, updatePlot, deletePlot } = usePlots(currentFarmId || undefined);

  // Redirect to farm selection if no farmId
  if (!currentFarmId) {
    return <Navigate to="/farms" replace />;
  }

  // Local UI State
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

  // State quản lý các Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null);
  const [selectedPlotRecommendation, setSelectedPlotRecommendation] = useState<Plot | null>(null);

  const { recommendations, isLoading: isRecommendationLoading, error: recommendationError } = usePlotCropRecommendations(
    selectedPlotRecommendation?.id,
  );

  // Fetch data handled automatically by usePlots hook reacting to currentFarmId

  // Tính toán Stats
  const totalPlots = plots.length;
  const totalArea = plots.reduce((sum, plot) => sum + (plot.areaHa || 0), 0);
  const activePlots = plots.filter((plot) => plot.status === 'ACTIVE').length;

  // Xử lý lọc dữ liệu
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const matchesSearch = plot.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || plot.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  }, [plots, searchTerm, statusFilter]);

  // Handlers cho CRUD
  const handleCreatePlot = async (plotData: CreatePlotRequest) => {
    if (!currentFarmId) return;
    try {
      await createPlot(plotData).unwrap();
      setIsCreateModalOpen(false);
      toast.success('Tạo lô đất mới thành công');
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleUpdatePlot = async (updatedPlot: Plot) => {
    if (!currentFarmId) return;
    try {
      const isClearDescription =
        updatedPlot.description != null && updatedPlot.description.trim() === '';
      const version = updatedPlot.version ?? plots.find((p) => p.id === updatedPlot.id)?.version;

      await updatePlot(updatedPlot.id, {
        version,
        name: updatedPlot.name,
        status: updatedPlot.status,
        ...(isClearDescription
          ? { isClearDescription: true }
          : { description: updatedPlot.description }),
      }).unwrap();
      setEditingPlot(null);
      toast.success('Cập nhật thông tin lô đất thành công');
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDeletePlot = async () => {
    if (deletingPlot && currentFarmId) {
      try {
        await deletePlot(deletingPlot.id).unwrap(); 
        toast.success('Đã xóa lô đất thành công');
        setDeletingPlot(null);
      } catch (err: any) {
        toast.error(err.message || 'Không thể xóa lô đất');
      }
    }
  };

  const handleViewMap = (plot: Plot) => {
    navigate(`/farms/${currentFarmId}/map?plotId=${plot.id}&source=land-plots`, {
      state: {
        selectedPlotId: plot.id,
        preloadPlot: plot,
        source: 'land-plots',
      },
    });
  };

  const handleViewRecommendations = (plot: Plot) => {
    setSelectedPlotRecommendation(plot);
  };

  const handleEditPlotInfo = (plot: Plot) => {
    setEditingPlot(plot);
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans bg-slate-50 min-h-0 text-left">
      {/* Header Section */}
      <div className="bg-white px-5 flex items-center justify-between border-b border-slate-200 shrink-0" style={{ height: '56px' }}>
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
          <div className="w-px bg-slate-200 mx-4 self-stretch my-2" />
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white mr-4 shrink-0">
            <LayoutGridIcon size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Quản lý lô đất</h1>
            <p className="text-sm text-slate-500 font-medium leading-tight mt-1">Quản lý danh sách và thông tin các khu vực canh tác</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 font-bold text-sm shadow-md shadow-emerald-600/20"
          >
            <PlusIcon size={18} strokeWidth={2.5} /> Tạo lô đất mới
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 shrink-0 shadow-sm">
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Tổng lô đất</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalPlots}</span>
            <span className="text-sm text-slate-500 font-semibold">lô</span>
          </div>
        </div>
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Tổng diện tích</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {totalArea.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
            <span className="text-sm text-slate-500 font-semibold">ha</span>
          </div>
        </div>
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Đang hoạt động</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{activePlots}</span>
            <span className="text-lg text-slate-400 font-bold">/ {totalPlots}</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <PlotFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Content Section */}
      <div className="flex-1 min-h-0 bg-white">
        {viewMode === 'table' ? (
          <PlotTable
            plots={filteredPlots}
            onEdit={handleEditPlotInfo}
            onDelete={setDeletingPlot}
            onViewMap={handleViewMap}
            onViewRecommendations={handleViewRecommendations}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlots.map((plot) => (
              <PlotCard
                key={plot.id}
                plot={plot}
                onEdit={handleEditPlotInfo}
                onDelete={setDeletingPlot}
                onViewMap={handleViewMap}
                onViewRecommendations={handleViewRecommendations}
              />
            ))}
            {filteredPlots.length === 0 && (
              <div className="col-span-full bg-white p-16 text-left">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-gray-100">
                  <LayoutGridIcon className="w-8 h-8 font-thin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Không tìm thấy lô đất nào phù hợp</h3>
                <p className="text-gray-500 mt-1 font-medium">Thử thay đổi bộ lọc hoặc thêm một lô đất mới.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      <CreatePlotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlot}
        existingPlots={plots}
      />

      <EditPlotModal
        isOpen={!!editingPlot}
        onClose={() => setEditingPlot(null)}
        onSave={handleUpdatePlot}
        plot={editingPlot}
      />

      <DeletePlotDialog
        isOpen={!!deletingPlot}
        onClose={() => setDeletingPlot(null)}
        onConfirm={handleDeletePlot}
        plot={deletingPlot}
        hasActiveTasks={false}
      />

      <PlotCropRecommendationModal
        isOpen={!!selectedPlotRecommendation}
        plotName={selectedPlotRecommendation?.name}
        recommendations={recommendations}
        loading={isRecommendationLoading}
        error={recommendationError}
        onClose={() => setSelectedPlotRecommendation(null)}
      />
    </div>
  );
}

export default LandPlotsPage;
