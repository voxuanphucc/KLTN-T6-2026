import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePlots } from '@/hooks/plots/usePlots';
import { useWarehouses } from '@/hooks/warehouses/useWarehouses';
import { Plot, GeoPoint, Geometry } from '../../types/plot';
import { Warehouse } from '../../types/warehouse/warehouse';
import { toast } from 'sonner';
import { ArrowLeft, Map as MapIcon, Search, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { FarmMap, FarmMapHandle } from '@/components/map/FarmMap';
import { DrawingToolbar, DrawingMode } from '@/components/map/DrawingToolbar';
import { BoundaryConfirmDialog } from '@/components/map/BoundaryConfirmDialog';
import { DeleteBoundaryDialog } from '@/components/map/DeleteBoundaryDialog';
import { CreatePlotModal } from '@/components/land-plots/CreatePlotModal';
import { EditPlotModal } from '@/components/land-plots/EditPlotModal';
import { MapSidebar } from '@/components/map/MapSidebar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { DeletePlotDialog } from '@/components/map/DeletePlotDialog';
import { isSelfIntersecting, polygonsOverlap, getPlotPath } from '../../utils/plotUtils';

export function MapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentFarmId } = useAuth();
  const { plots, fetchPlots, createPlot, updatePlot, deletePlot } = usePlots(currentFarmId ?? undefined);
  const { warehouses, fetchWarehouses } = useWarehouses();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const [mode, setMode] = useState<DrawingMode>('none');
  const [currentPath, setCurrentPath] = useState<GeoPoint[]>([]);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [plotToDelete, setPlotToDelete] = useState<Plot | null>(null);
  const [overlappingPlotName, setOverlappingPlotName] = useState<string | null>(null);
  const farmMapRef = useRef<FarmMapHandle>(null);
  const pathToSaveRef = useRef<GeoPoint[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [mapShowDropdown, setMapShowDropdown] = useState(false);
  const [mapIsSearching, setMapIsSearching] = useState(false);
  const mapIsSelectingRef = useRef(false);

  useEffect(() => {
    if (!mapSearchQuery.trim()) {
      setMapSuggestions([]);
      setMapShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setMapIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=5&accept-language=vi&email=kltn.vietnam.student@gmail.com`
        );
        const data = await res.json();
        setMapSuggestions(data);
        setMapShowDropdown(true);
      } catch { /* ignore */ } finally {
        setMapIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  // Callback ổn định để nhận mapInstance từ FarmMap sau khi load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const locationState = location.state as {
    selectedPlotId?: string;
    selectedWarehouseId?: string;
    mode?: DrawingMode;
    source?: string;
    preloadPlot?: Plot;
    preloadWarehouse?: Warehouse;
  } | null;

  const selectedPlotIdFromUrl = searchParams.get('plotId') ?? undefined;
  const selectedWarehouseIdFromUrl = searchParams.get('warehouseId') ?? undefined;
  const modeFromUrl = (searchParams.get('mode') as DrawingMode | null) ?? undefined;
  const targetPlotId = selectedPlotIdFromUrl ?? locationState?.selectedPlotId;
  const targetWarehouseId = selectedWarehouseIdFromUrl ?? locationState?.selectedWarehouseId;
  const targetMode = modeFromUrl ?? locationState?.mode;

  if (!currentFarmId) {
    return <Navigate to="/farms" replace />;
  }

  // Initial data fetch
  useEffect(() => {
    if (currentFarmId) {
      fetchPlots();
      fetchWarehouses(currentFarmId);
    }
  }, [currentFarmId, fetchPlots, fetchWarehouses]);

  // Sync selected items from location state (one-time or on state change)
  useEffect(() => {
    if (locationState?.preloadPlot) {
      setSelectedPlot(prev => prev?.id === locationState.preloadPlot?.id ? prev : locationState.preloadPlot!);
      if (targetMode === 'editing') {
        handleEditBoundaries(locationState.preloadPlot);
      }
    }
    if (locationState?.preloadWarehouse) {
      setSelectedWarehouse(prev => prev?.id === locationState.preloadWarehouse?.id ? prev : locationState.preloadWarehouse!);
    }
  }, [locationState?.preloadPlot, locationState?.preloadWarehouse, targetMode]);

  // Sync selection with URL parameters
  useEffect(() => {
    if (targetPlotId && plots.length > 0) {
      const plot = plots.find((p) => p.id === targetPlotId);
      if (plot) {
        setSelectedPlot(prev => prev?.id === plot.id ? prev : plot);
        setSelectedWarehouse(null);
        if (targetMode === 'editing') {
          handleEditBoundaries(plot);
        } else {
          setMode(prev => prev === 'none' ? prev : 'none');
          setCurrentPath(prev => prev.length === 0 ? prev : []);
        }
      }
      return;
    }

    if (targetWarehouseId && warehouses.length > 0) {
      const wh = warehouses.find(w => w.id === targetWarehouseId);
      if (wh) {
        setSelectedWarehouse(prev => prev?.id === wh.id ? prev : wh);
        setSelectedPlot(null);
        setMode(prev => prev === 'none' ? prev : 'none');
        setCurrentPath(prev => prev.length === 0 ? prev : []);
      }
      return;
    }

    // Reset if no target and we have a selection
    if (!targetPlotId && !targetWarehouseId && (selectedPlot || selectedWarehouse)) {
      setSelectedPlot(null);
      setSelectedWarehouse(null);
      setMode('none');
      setCurrentPath([]);
    }
  }, [targetPlotId, targetWarehouseId, targetMode, plots, warehouses]);

  const computeArea = (path: GeoPoint[]) => {
    if (path.length < 3) return 0;
    if (!window.google) return 0;
    try {
      const googlePath = path.map(p => new window.google.maps.LatLng(p.lat, p.lng));
      const areaInSqMeters = window.google.maps.geometry.spherical.computeArea(googlePath);
      return areaInSqMeters / 10000;
    } catch (e) {
      console.error('Lỗi tính diện tích:', e);
      return 0;
    }
  };

  const handleSaveDrawing = () => {
    const path =
      mode === 'editing' && farmMapRef.current
        ? farmMapRef.current.getEditedPath()
        : currentPath;

    if (path.length < 3) {
      toast.error('Cần ít nhất 3 điểm để tạo ranh giới.');
      return;
    }
    if (isSelfIntersecting(path)) {
      toast.error('Ranh giới không hợp lệ. Ranh giới không được cắt nhau');
      return;
    }
    const otherPlots = plots.filter((p) => p.id !== selectedPlot?.id);
    const hasOverlap = otherPlots.some((p) => {
      const otherPath = getPlotPath(p);
      return polygonsOverlap(path, otherPath);
    });
    if (hasOverlap) {
      toast.error('Ranh giới đang chồng chéo với lô đất khác. Vui lòng điều chỉnh lại.');
      return;
    }
    pathToSaveRef.current = path;
    if (mode === 'editing') setCurrentPath(path);
    const area = computeArea(path);
    setCalculatedArea(area);
    setIsConfirmOpen(true);
  };

  const handleCreatePlotFromMap = async (plotData: any) => {
    if (!currentFarmId) return;
    try {
      await createPlot(plotData).unwrap();
      toast.success('Tạo lô đất mới thành công');
      setIsCreateModalOpen(false);
      setMode('none');
      setCurrentPath([]);
      fetchPlots();
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo lô đất');
    }
  };

  const handleConfirmSave = async () => {
    if (!currentFarmId) return;
    setIsConfirmOpen(false);
    const path = pathToSaveRef.current.length > 0 ? pathToSaveRef.current : currentPath;

    if (selectedPlot) {
      const geometry: Geometry = {
        type: 'Polygon',
        coordinates: [[...path.map((p) => [p.lng, p.lat]), [path[0]?.lng, path[0]?.lat]]],
      };
      const isClearDescription =
        selectedPlot.description != null && selectedPlot.description.trim() === '';
      const selectedPlotVersion = selectedPlot.version ?? plots.find((p) => p.id === selectedPlot.id)?.version;
      try {
        const result = await updatePlot(selectedPlot.id, {
          version: selectedPlotVersion,
          name: selectedPlot.name,
          status: selectedPlot.status,
          geometry,
          ...(isClearDescription
            ? { isClearDescription: true }
            : { description: selectedPlot.description }),
        }).unwrap();
        toast.success('Cập nhật ranh giới lô đất thành công');
        setSelectedPlot(result);
        setMode('none');
        setCurrentPath([]);
        setOverlappingPlotName(null);
        pathToSaveRef.current = [];
        fetchPlots();
      } catch (err: any) {
        toast.error(err.message || 'Lỗi cập nhật ranh giới');
      }
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleCancelDrawing = () => {
    setMode('none');
    setCurrentPath([]);
    setOverlappingPlotName(null);
    pathToSaveRef.current = [];
  };

  const handleUndoDrawingPoint = () => {
    setCurrentPath(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  const handleClearDrawingPath = () => {
    setCurrentPath([]);
    setOverlappingPlotName(null);
  };

  const handleStartDrawing = (plot: Plot) => {
    setSelectedPlot(plot);
    setMode('drawing');
    setCurrentPath([]);
  };

  const handleEditBoundaries = (plot: Plot) => {
    setSelectedPlot(plot);
    setMode('editing');
    if (plot.geometry?.type === 'Polygon') {
      const path = plot.geometry.coordinates[0].map((coord: any) => ({
        lng: coord[0],
        lat: coord[1],
      }));
      path.pop();
      setCurrentPath(path);
    } else if (plot.boundaries) {
      setCurrentPath(plot.boundaries);
    }
  };

  const handleSelectPlot = (plot: Plot | null) => {
    setSelectedPlot(plot);
    setSelectedWarehouse(null);
    if (plot) {
      setSearchParams({ plotId: plot.id });
    } else {
      setSearchParams({});
    }
    if (mode !== 'none') {
      setMode('none');
      setCurrentPath([]);
    }
  };

  const handleSelectWarehouse = (wh: Warehouse | null) => {
    setSelectedWarehouse(wh);
    setSelectedPlot(null);
    if (wh) {
      setSearchParams({ warehouseId: wh.id });
    } else {
      setSearchParams({});
    }
    if (mode !== 'none') {
      setMode('none');
      setCurrentPath([]);
    }
  };


  const handleDeleteBoundary = async () => {
    if (!currentFarmId) return;
    setIsDeleteModalOpen(false);
    if (!selectedPlot) return;
    try {
      const selectedPlotVersion = selectedPlot.version ?? plots.find((p) => p.id === selectedPlot.id)?.version;
      const result = await updatePlot(selectedPlot.id, { version: selectedPlotVersion, isClearGeometry: true }).unwrap();
      toast.success('Đã xóa ranh giới lô đất');
      setSelectedPlot(result);
      setMode('none');
      setCurrentPath([]);
      fetchPlots();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa ranh giới');
    }
  };

  const handleDeletePlotClick = (plot: Plot) => {
    setPlotToDelete(plot);
  };

  const handleConfirmDeletePlot = async () => {
    if (!currentFarmId || !plotToDelete) return;
    try {
      await deletePlot(plotToDelete.id).unwrap();
      toast.success(`Đã xóa lô đất "${plotToDelete.name}"`);
      if (selectedPlot?.id === plotToDelete.id) {
        setSelectedPlot(null);
        setMode('none');
        setCurrentPath([]);
      }
      setPlotToDelete(null);
      fetchPlots();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa lô đất');
    }
  };

  const handleUpdatePlotInfo = async (updatedPlot: Plot) => {
    if (!currentFarmId) return;
    try {
      const isClearDescription =
        updatedPlot.description != null && updatedPlot.description.trim() === '';
      const version = updatedPlot.version ?? plots.find((p) => p.id === updatedPlot.id)?.version;
      const result = await updatePlot(updatedPlot.id, {
        version,
        name: updatedPlot.name,
        status: updatedPlot.status,
        ...(isClearDescription
          ? { isClearDescription: true }
          : { description: updatedPlot.description }),
      }).unwrap();
      toast.success('Cập nhật thông tin lô đất thành công');
      setEditingPlot(null);
      setSelectedPlot(result);
      fetchPlots();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật thông tin lô đất');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      {/* Header */}
<div className="bg-white border-b border-slate-200 px-5 flex items-center shrink-0" style={{ height: '56px' }}>
  <button
    onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm shrink-0"
  >
    <ArrowLeft size={15} />
    Quay lại
  </button>

  <div className="w-px bg-slate-200 mx-4 self-stretch my-3" />

  <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center mr-3 shrink-0">
    <MapIcon size={16} className="text-slate-500" />
  </div>

  <div>
    <h1 className="text-sm font-semibold text-slate-900 leading-tight">Bản đồ nông trại</h1>
    <p className="text-xs text-slate-400 leading-tight mt-0.5">Trực quan hóa và quản lý không gian các khu vực canh tác</p>
  </div>
</div>
    

      <MapCanvas
        isDrawing={mode !== 'none'}
        currentPath={currentPath}
        farmMapRef={farmMapRef}
        mapInstance={mapInstance}
        isOverlapping={!!overlappingPlotName}
      >
        {({ isFullscreen }) => (
          <>
            <div 
              className="absolute top-4 left-4 z-20 w-72 rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
              style={{ maxHeight: 'calc(100% - 2rem)' }}
            >
          <MapSidebar
            plots={plots}
            warehouses={warehouses}
            selectedPlot={selectedPlot}
            selectedWarehouse={selectedWarehouse}
            onSelectPlot={handleSelectPlot}
            onSelectWarehouse={handleSelectWarehouse}
            onEditPlot={setEditingPlot}
            onEditBoundaries={handleEditBoundaries}
            onStartDraw={handleStartDrawing}
            onDeletePlot={handleDeletePlotClick}
          />
        </div>

        <FarmMap
          ref={farmMapRef}
          plots={plots}
          selectedPlotId={selectedPlot?.id}
          isDrawing={mode !== 'none'}
          isEditing={mode === 'editing'}
          currentPath={currentPath}
          onPathChange={setCurrentPath}
          onPlotSelect={handleSelectPlot}
          selectedPlot={selectedPlot}
          onOverlapChange={setOverlappingPlotName}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouse?.id}
          onWarehouseSelect={handleSelectWarehouse}
          onMapLoad={handleMapLoad}
          onDrawFinish={handleSaveDrawing}
        />

        <DrawingToolbar
          mode={mode}
          onModeChange={setMode}
          onSave={handleSaveDrawing}
          onCancel={handleCancelDrawing}
          canSave={currentPath.length >= 3}
          overlappingPlotName={overlappingPlotName}
          onUndo={handleUndoDrawingPoint}
          onClear={handleClearDrawingPath}
          canUndo={currentPath.length > 0}
        />
        {/* Search box — hiện khi toàn màn hình */}
        {isFullscreen && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[220px] sm:w-[300px]">
            <div className="relative shadow-md rounded-xl border border-gray-200 bg-white/95 backdrop-blur-md">
              <input
                type="text"
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                placeholder="Tìm kiếm địa chỉ..."
                className="w-full h-9 pl-9 pr-9 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (mapSuggestions.length > 0) {
                      const first = mapSuggestions[0];
                      const coords = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
                      mapInstance?.setCenter(coords);
                      mapInstance?.setZoom(17);
                      setMapSearchQuery(first.display_name);
                      setMapShowDropdown(false);
                    }
                  }
                }}
                onFocus={() => { if (mapSuggestions.length > 0) setMapShowDropdown(true); }}
                onBlur={() => { if (!mapIsSelectingRef.current) setMapShowDropdown(false); }}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              {mapIsSearching ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : mapSearchQuery ? (
                <button
                  type="button"
                  onClick={() => { setMapSearchQuery(''); setMapSuggestions([]); setMapShowDropdown(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              ) : null}

              {mapShowDropdown && mapSuggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 py-1 divide-y divide-gray-50"
                  onMouseDown={() => { mapIsSelectingRef.current = true; }}
                  onMouseUp={() => { mapIsSelectingRef.current = false; }}
                >
                  {mapSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
                        mapInstance?.setCenter(coords);
                        mapInstance?.setZoom(17);
                        setMapSearchQuery(item.display_name);
                        setMapShowDropdown(false);
                        mapIsSelectingRef.current = false;
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors truncate font-semibold"
                      title={item.display_name}
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <BoundaryConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSave}
          plotName={selectedPlot?.name || 'Lô đất mới'}
          calculatedArea={calculatedArea}
        />

        <DeleteBoundaryDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteBoundary}
          plotName={selectedPlot?.name || ''}
        />

        <DeletePlotDialog
          plot={plotToDelete}
          onClose={() => setPlotToDelete(null)}
          onConfirm={handleConfirmDeletePlot}
        />

        <CreatePlotModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreatePlotFromMap}
          existingPlots={plots}
          initialGeometry={{
            type: 'Polygon',
            coordinates: [[...currentPath.map(p => [p.lng, p.lat]), [currentPath[0]?.lng, currentPath[0]?.lat]]]
          }}
          initialAreaHa={calculatedArea}
        />

        <EditPlotModal
          isOpen={!!editingPlot}
          onClose={() => setEditingPlot(null)}
          onSave={handleUpdatePlotInfo}
          plot={editingPlot}
        />
          </>
        )}
      </MapCanvas>
    </div>
  );
}

export default MapPage;